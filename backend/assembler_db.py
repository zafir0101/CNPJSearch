import threading
import queue
import io
import requests
import xml.etree.ElementTree as ET
import re
import zipfile
import sqlite3

WEBDAVURL = "https://arquivos.receitafederal.gov.br/public.php/webdav/"
TOKEN = "YggdBLfdninEJX9"

def get_dir() -> str | None:
    response = requests.request(
        "PROPFIND",
        url = WEBDAVURL,
        auth = (TOKEN, ""),
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

def get_files(dir: str) -> list[str] | None:
    response = requests.request(
        "PROPFIND",
        url = WEBDAVURL+dir,
        auth = (TOKEN, ""),
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

        match = re.search(r'\/(\w+\.zip)', file) 

        if match:
            files.append(match.group(1))
    
    return files

def download(dir: str, files: list[str], zip_buffer: queue.Queue):
    counter = 0
    for file in files:
        counter += 1
        print(f"download {file}")
        response = requests.request(
            "GET",
            url = WEBDAVURL+dir+'/'+file,
            auth = (TOKEN, ""),
            headers = {"Depth": "1"}
        )

        if response.status_code != 200:
            return None

        zip_buffer.put(response.content)

    zip_buffer.put(None)
    
def extract(zip_buffer: queue.Queue, extracted_file_buffer: queue.Queue):
    while True:
        zip = zip_buffer.get()
        if zip is None:
            extracted_file_buffer.put(None)
            break
        
        with zipfile.ZipFile(io.BytesIO(zip)) as zip_ref:
            data = zip_ref.namelist()
            for name in data: extracted_file_buffer.put(zip_ref.open(name)) # talvez coloca varios IO

def write():
    pass

if __name__ == "__main__":
    # con = sqlite3.connect("cnpj.db")
    # cur = con.cursor()
    
    zip_buffer = queue.Queue(maxsize=3) 
    extracted_file_buffer = queue.Queue(maxsize=3)
    
    dir = get_dir()
    if dir is None: raise RuntimeError("Directory not found") 

    files = get_files(dir)

    download_thread = threading.Thread(target=download, args=(dir, files, zip_buffer))
    extract_thread = threading.Thread(target=extract, args=(zip_buffer, extracted_file_buffer))

    download_thread.start()
    extract_thread.start()
    
    download_thread.join()
    extract_thread.join()

