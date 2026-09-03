import requests
import xml.etree.ElementTree as ET
import re

WEBDAVURL = "https://arquivos.receitafederal.gov.br/public.php/webdav/"
TOKEN = "YggdBLfdninEJX9"

def get_year_dirs() -> list[str]:

    response = requests.request(
        "PROPFIND",
        url = WEBDAVURL,
        auth = (TOKEN, ""),
        headers = {"Depth": "1"}
    )

    if response.status_code != 207:
        return list()

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

    dirs.sort(reverse=True)
    return dirs

def get_files(dir: str) -> list[str]:
    response = requests.request(
        "PROPFIND",
        url = WEBDAVURL+dir,
        auth = (TOKEN, ""),
        headers = {"Depth": "1"}
    )

    if response.status_code != 207:
        return list()

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

get_files(get_year_dirs()[0])
