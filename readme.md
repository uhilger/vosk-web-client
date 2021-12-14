# Vosk Web Client

Eine Demo der Verwendung eines [Vosk Servers](https://alphacephei.com/vosk/server) im Web Browser.



## Verwendung

Auf der lokalen Maschine die folgenden Schritte ausführen:

1. Das Kommando `docker run -d -p 2700:2700 alphacep/kaldi-de:latest` zum Starten des Vosk Servers ausführen

2. Die Datei `index.html` aus dem Ordner `public_html` im Browser öffnen

3. Im Feld `Server` der Demoseite die Adresse des Servers angeben, z.B. `ws://localhost:2700`

Wenn die Websocket-Verbindung zum Vosk Server auf der lokalen Maschine gelingt, erscheint 'ok' hinter dem Eingabefeld.

Mit Einschalten der Spracherkennung zeigt der Browser einen Dialog, in dem die Freigabe zur Nutzung des Mikrofons erbeten wird. Mit Freigabe der Mikrofonnutzung arbeitet die Spracherkennung bis diese wieder ausgeschaltet wird.



## Voraussetzungen

Auf der betreffenden Maschine muss Docker installiert sein. 
