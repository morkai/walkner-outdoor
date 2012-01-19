# Wygrzewanie opraw LED

## Wymagania

### node.js

JavaScript po stronie serwera. Najlepiej najnowsza wersja produkcyjna.

Do pobrania tutaj: http://nodejs.org/#download

Opis instalacji tutaj: https://github.com/joyent/node/wiki/Installation

### NPM

Menadżer pakietów node.js. NPM dołączany jest od niedawna do node.js.

### MongoDB

Baza danych NoSQL. Najlepiej najnowsza wersja produkcyjna.

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

## Konfiguracja

Pliki konfiguracyjne to pliki JavaScript znajdujące się w katalogu `config/`.

### express.js

Konfiguracja serwera HTTP [express](http://expressjs.com/).

  * `port` - port na jakim ma odpowiadać aplikacja.

### mongoose.js

Konfiguracja klienta bazy danych _MongoDB_.

  * `uri` - URI zawierające informacje potrzebne do połączenia się z bazą
    danych w formacie `mongodb://<host>[:<port>]/<nazwa bazy>`.

### libcoap.js

Konfiguracja sterownika opartego na _libcoap_.

  * `maxRetries` - ile razy dane żądanie ma zostać ponownie wysłane zanim
    zostanie ono uznane za zakończone błędem.

  * `coapClientPath` - absolutna ścieżka do pliku wykonywalnego `coap-client`.

  * `stateFilesDir` - absolutna ścieżka do folderu z plikami `one.bin`
    oraz `zero.bin`.

### logging.js

Konfiguracja logów. Do `stdout` przekazywane będą logi poziomów: `log`, `debug`,
`info`, `warn` oraz `error`.

  * `productionLevels` - obiekt definiujący jakiego poziomu logi mają
    przechodzić przez filtr, jeżeli `NODE_ENV` jest ustawione na `production`.

  * `developmentLevels` - obiekt definiujący jakiego poziomu logi mają
    przechodzić przez filtr, jeżeli `NODE_ENV` jest ustawione na `development`.

### auth.js

Konfiguracja uwierzytelniania i autoryzacji.

  * `superUser` - obiekt super użytkownika (ma wszystkie uprawnienia).
    Można się na niego zalogować używając zdefiniowanego loginu i hasła mimo
    tego, że nie znajduje się on w bazie danych. Przydatne przy uruchomieniu
    na czystej bazie danych.

  * `guestUser` - obiekt użytkownika przypisywany do niezalogowanych klientów.
    Można definiować, do jakich funkcji mają mieć dostęp niezalogowani
    użytkownicy.

### limits.js

Konfiguracja limitów.

  * `maxZones` - maksymalna liczba stref jaka może zostać stworzona.
    W przypadku osiągnięcia limitu, przycisk dodawania nowej strefy zostanie
    zablokowany.

  * `maxPrograms` - maksymalna liczba programów jaka może zostać stworzona.
    W przypadku osiągnięcia limitu, przycisk dodawania nowego programu zostanie
    zablokowany.

## Uruchomienie

Jeżeli jeszcze nie uruchomione, startujemy MongoDB:

    $ mongod --dbpath walkner-outdoor/var/data/

Dokładne informacje dot. uruchamiania MongoDB dostępne są
[tutaj](http://www.mongodb.org/display/DOCS/Starting+and+Stopping+Mongo).

Uruchamiamy serwer aplikacji w trybie `development` lub `production`:

  * pod *nix:

        $ NODE_ENV=development node walkner-outdoor/app/server.js

  * pod Windows:

        $ SET NODE_ENV=development
        $ node walkner-outdoor/app/server.js

Aplikacja powinna być dostępna na porcie, który jest ustawiony
w `config/express.js` (domyślnie 8080). Wchodzimy w przeglądarce na adres
http://127.0.0.1:8080/.
