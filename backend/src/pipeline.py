import io
import queue
import re
import threading
import xml.etree.ElementTree as ET
import zipfile
from typing import Callable

import db
import requests

ProgressCallback = Callable[[dict], None]

def _report(on_progress: ProgressCallback | None, **patch) -> None:
    if on_progress is not None:
        on_progress(patch)


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

        match = re.search(r'(?!.*(Qualificacoes|Paises|Simples|Motivos))(?=\/(\w+\.zip))', file) 
        if match:
            files.append(match.group(2))
    
    return files

def _download(dir: str, files: list[str], zip_buffer: queue.Queue, on_progress: ProgressCallback | None = None):
    total = len(files)
    for done, file in enumerate(files, start=1):
        print(f"download {file}")
        _report(on_progress, stage='baixando', current_file=file, files_done=done - 1, files_total=total)
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
        _report(on_progress, stage='baixando', current_file=file, files_done=done, files_total=total)
    zip_buffer.put(None)
    
def _extract(zip_buffer: queue.Queue, extracted_file_buffer: queue.Queue, on_progress: ProgressCallback | None = None):
    while True:
        zip = zip_buffer.get()
        if zip is None:
            extracted_file_buffer.put(None)
            break

        print(f"extraindo {zip[0]}")
        _report(on_progress, stage='extraindo', current_file=zip[0])
        with zipfile.ZipFile(io.BytesIO(zip[1])) as zip_ref:
            data = zip_ref.namelist()
            for name in data: extracted_file_buffer.put((zip[0], zip_ref.read(name))) 
            print(f"extraido {zip[0]}")

def _write(db: db.DataBase, extracted_file_buffer: queue.Queue, on_progress: ProgressCallback | None = None):
    while True:
        ext_file = extracted_file_buffer.get()
        if ext_file is None: break
        _report(on_progress, stage='gravando', current_file=ext_file[0])
        db.write(ext_file)
                

def init_pipeline(db: db.DataBase, on_progress: ProgressCallback | None = None):
    zip_buffer = queue.Queue(maxsize=3) 
    extracted_file_buffer = queue.Queue(maxsize=3)

    _report(on_progress, stage='listando_diretorio', current_file=None)
    dir = _get_dir()
    if dir is None: raise RuntimeError("Directory not found") 

    _report(on_progress, stage='listando_arquivos', current_file=None)
    files = _get_files(dir)
    _report(on_progress, stage='iniciando', current_file=None, files_done=0, files_total=len(files or []))

    download_thread = threading.Thread(target=_download, args=(dir, files, zip_buffer, on_progress))
    extract_thread = threading.Thread(target=_extract, args=(zip_buffer, extracted_file_buffer, on_progress))
    write_thread = threading.Thread(target=_write, args=(db, extracted_file_buffer, on_progress))

    download_thread.start()
    extract_thread.start()
    write_thread.start()

    download_thread.join()
    extract_thread.join()
    write_thread.join()

    _report(on_progress, stage='concluido', current_file=None)
