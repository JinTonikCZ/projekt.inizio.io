# Search Extractor (Inizio Project)

A lightweight, containerized web application that performs custom Google searches using the official Google Custom Search API. 

The project is split into a frontend client and a backend proxy to ensure API keys remain secure and are not exposed to the client-side browser.

## Architecture

* **Frontend (`/web`)**: A vanilla HTML, CSS, and JavaScript interface served by an NGINX web server. It handles the UI and sends search queries to the local proxy.
* **Backend (`/proxy`)**: A secure proxy service that attaches the Google API credentials to the request and forwards it to the Google API endpoint.
* **Orchestration**: Docker Compose is used to build and network both services seamlessly.

## Prerequisites

Before you begin, ensure you have the following installed:
* [Docker](https://www.docker.com/)
* Docker Compose

You will also need valid Google Custom Search API credentials:
* `GOOGLE_API_KEY`
* `GOOGLE_CX` (Search Engine ID)

## Project Structure

Ensure your repository is organized as follows before running the application:

.
├── .env                 # Your secret API keys (do not commit this!)
├── .env.example         # Example environment file
├── docker-compose.yml   # Docker Compose configuration
├── proxy/               # Backend proxy source code and its Dockerfile
└── web/                 # Frontend assets (HTML, JS, CSS), NGINX config, and its Dockerfile





# test projekt pro inizio 
...
Popíšu tento redmy, pokud nezapomenu xd )) 
https://jintonikcz.github.io/projekt.inizio.io/

1) vytvořit HTML stránku s jedním inputem
2) zadám do ní klíčové slovní spojení

3) dostanu vytažené výsledky z google 1. strany (pouze přirozené vyhledávání), které si mohu uložit na PC v jakémkoliv strojově čitelném - strukturovaném formátu (ne HTML)

4) vytvořený kód pokryjte unit testem/y (který minimálně otestuje správnost výstupu) v rozsahu dle Vašeho uvážení

5) umístit prosím někam na internet, kde to můžeme otestovat
6) natočit video, kde vlastními slovy popište funkci naprogramovaného kódu + ukázku zelených unit testů (tip na extra-rychlá videa přímo z prohlížeče: vidyard.com)
6) přibalit zdrojový kód a poslat mailem

7) nepovinný bod: vytvořte “docker compose”, který celé řešení spustí pro lokální vývoj
Zadání prosím zpracujte a pošlete mi na jaros@inizio.cz. V e-mailu bude:
link na fungující řešení dle zadání výše
odkaz na video popisující zdrojový kód
ZIP soubor obsahující zdrojový kód
Přidejte i své CV a motivační dopis,
