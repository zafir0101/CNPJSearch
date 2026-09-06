import io
import queue
import re
import threading
import xml.etree.ElementTree as ET
import zipfile

import db
import requests


_WEBDAVURL = "https://arquivos.receitafederal.gov.br/public.php/webdav/"
_TOKEN = "YggdBLfdninEJX9"

def _get_dir() -> str | None:
    response = requests.request(
        "PROPFIND",
        url = _WEBDAVURL,
        auth = (_TOKEN, ""),
        headers = {"Depth": "1"}
    )

    if response.status_code != 207:
        return None

    dirs = []
    root = ET.fromstring(response.text)
    namespace = {'d': 'DAV:'}

    for response in root.findall('d:response', namespace):
            href = response.find('d:href', namespace)
            if href is None:
                continue
            
            dir = href.text
            if dir is None:
                continue

            match = re.search(r'/(\d{4}-\d{2})/$', dir) 
        
            if match:
                dirs.append(match.group(1))

    return dirs[-1]

def _get_files(dir: str) -> list[str] | None:
    response = requests.request(
        "PROPFIND",
        url = _WEBDAVURL+dir,
        auth = (_TOKEN, ""),
        headers = {"Depth": "1"}
    )

    if response.status_code != 207:
        return None

    files = []
    root = ET.fromstring(response.text)
    namespace = {'d': 'DAV:'}

    for response in root.findall('d:response', namespace):
        href = response.find('d:href', namespace)
        if href is None:
            continue
        
        file = href.text
        if file is None:
            continue

        match = re.search(r'^(?!.*(Qualificacoes|Paises|Simples))\/(\w+\.zip)', file) 

        if match:
            files.append(match.group(1))
    
    return files

def _download(dir: str, files: list[str], zip_buffer: queue.Queue):
    for file in files:
        print(f"download {file}")
        response = requests.request(
            "GET",
            url = _WEBDAVURL+dir+'/'+file,
            auth = (_TOKEN, ""),
            headers = {"Depth": "1"}
        )

        if response.status_code != 200:
            return None

        zip_buffer.put((file, response.content))
        print(f"download feito {file}")
    zip_buffer.put(None)
    
def _extract(zip_buffer: queue.Queue, extracted_file_buffer: queue.Queue):
    while True:
        zip = zip_buffer.get()
        print(f"extraindo {zip[0]}")
        if zip is None:
            extracted_file_buffer.put(None)
            break
        
        with zipfile.ZipFile(io.BytesIO(zip[1])) as zip_ref:
            data = zip_ref.namelist()
            for name in data: extracted_file_buffer.put((zip[0], zip_ref.read(name))) 
            print(f"extraido {zip[0]}")

def _write(db: db.DataBase, extracted_file_buffer: queue.Queue):
    while True:
        ext_file = extracted_file_buffer.get()
        if ext_file is None: break
        db.write(ext_file)
                

def init_pipeline(db: db.DataBase):
    zip_buffer = queue.Queue(maxsize=3) 
    extracted_file_buffer = queue.Queue(maxsize=3)
    
    dir = _get_dir()
    if dir is None: raise RuntimeError("Directory not found") 

    files = _get_files(dir)

    download_thread = threading.Thread(target=_download, args=(dir, files, zip_buffer))
    extract_thread = threading.Thread(target=_extract, args=(zip_buffer, extracted_file_buffer))
    write_thread = threading.Thread(target=_write, args=(db, extracted_file_buffer))

    download_thread.start()
    extract_thread.start()
    write_thread.start()

    download_thread.join()
    extract_thread.join()
    write_thread.join()
