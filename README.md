# Wygrzewanie opraw LED

## Wymagania

### node.js

JavaScript po stronie serwera. Najlepiej najnowsza wersja.

Do pobrania tutaj: http://nodejs.org/#download

Opis instalacji tutaj: https://github.com/joyent/node/wiki/Installation

### NPM

Menadżer pakietów node.js. NPM dołączany jest od niedawna do node.js.

### MongoDB

Baza danych NoSQL. Najlepiej wersja produkcyjna.

Do pobrania tutaj: http://www.mongodb.org/downloads

## Instalacja

Klonujemy repozytorium:

    git clone git://github.com/morkai/walkner-outdoor.git

Lub je [ściągamy](https://github.com/morkai/walkner-outdoor/zipball/master)
i rozpakowujemy.

Przechodzimy do głównego katalogu projektu:

    $ cd walkner-outdoor/

Instalujemy zależne pakiety:

    $ npm install

## Uruchomienie

Jeżeli jeszcze nie uruchomione, startujemy MongoDB:

    $ mongod --fork --logpath /dev/null

Uruchamiamy serwer aplikacji:

    $ node walkner-outdoor/app/server.js

Aplikacja powinna być dostępna na porcie 8080.