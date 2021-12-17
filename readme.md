# Vosk Web Client

Eine Demo der Verwendung eines [Vosk Servers](https://alphacephei.com/vosk/server) aus einem Web Browser heraus.



## Verwendung

Zur Ausführung der Demo auf der lokalen Maschine die folgenden Schritte ausführen:

1. Das Kommando `docker run -d -p 2700:2700 alphacep/kaldi-de:latest` zum Starten des Vosk Servers ausführen

2. Den Inhalt des Ordners `public_html` auf die lokale Maschine kopieren

3. Die Datei `index.html` aus dem Ordner `public_html` im Browser öffnen

4. Im Feld `Server` der Demoseite die Adresse des Servers angeben, z.B. `ws://localhost:2700`

Wenn die Websocket-Verbindung zum Vosk Server auf der lokalen Maschine gelingt, erscheint 'ok' hinter dem Eingabefeld.

Mit Einschalten der Spracherkennung zeigt der Browser einen Dialog, in dem die Freigabe zur Nutzung des Mikrofons erbeten wird. Mit Freigabe der Mikrofonnutzung arbeitet die Spracherkennung bis diese wieder ausgeschaltet wird.


## Voraussetzungen

Auf der betreffenden Maschine müssen Docker installiert und ein Mikrofon angeschlossen oder eingebaut sein. 

## Hinweis

Dieser Webclient ist als [Durchstich](https://de.wikipedia.org/wiki/Prototyping_(Softwareentwicklung)#Vertikales_Prototyping_(Durchstich)) entstanden und in diesem Sinne experimentell. Bestimmte Aufrufe der Web Audio API können z.B. noch in Richtung neuerer Varianten wie etwa Worklets weiterentwickelt werden.