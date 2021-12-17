/* 
 * JavaScript Code zur Steuerung der Spracherkennungs-Demo
 * von Ulrich Hilger
 */

var kanaldaten = [];
var aufnahmegeraet = null;
var aufnahmeLaenge = 0;
var tonquelle = null;
var abtastRate = 44100;
var audioKontext = null;
var stille = true;
var pausenLaenge = 0.0;
var gemesseneZeit = 0;
var datenVorhanden = false;
var mitschnittFortsetzen = true;
var startZeit;

// Bedienelemente an Funktionen binden

document.getElementById("mic-ein").addEventListener('change', mikroEinschalter);
document.getElementById("mic-aus").addEventListener('change', mikroAusschalter);
document.getElementById("url").addEventListener('blur', testWs);

// Bedienoberflaeche-Funktionen

function mikroEinschalter(event) {
  event.preventDefault();
  if (event.target.checked) {
    console.log('mikrofon ein');
    mikroEin();
  }
}

function mikroAusschalter(event) {
  event.preventDefault();
  if (event.target.checked) {
    console.log('mikrofon aus');
    mikroAus();
  }
}

function testWs(event) {
  var url = document.querySelector('#url');
  var webSocket = new WebSocket(url.value);

  webSocket.onmessage = event => {
  };

  webSocket.onopen = event => {
    document.querySelector('.wsinfo').textContent = 'ok';
    webSocket.close();
  };

  webSocket.onerror = event => {
    console.error("WebSocket Fehler:", event);
    document.querySelector('.wsinfo').textContent = 'Fehler';
  };
}

// Audio-Funktionen

/*
 Mikrofon einschalten, Mitschnitt und Verarbeitung starten
 */
function mikroEin() {
  kanaldaten = [];
  document.querySelector('.ergebnis').textContent = '';
  audioKontext = new AudioContext();
  var constraints = {audio: true, video: false};
  navigator.mediaDevices.getUserMedia(constraints)
          .then(mitschnitt)
          .catch(function (err) {
            console.log(err.name + ": " + err.message);
            var ausschalter = document.getElementById("mic-aus");
            ausschalter.checked = true;
          });
}

/*
 Mikrofon ausschalten, die Objekte fuer den Mitschnitt 
 trennen und verwerfen
 */
function mikroAus() {
  tonquelle.disconnect(aufnahmegeraet);
  tonquelle.disconnect();
  aufnahmegeraet.disconnect(audioKontext.destination);
  audioKontext.close();
  audioKontext = null;
}

function mitschnitt(quelle) {
  console.log("Der Benutzer hat der Nutzung des Mikrofons zugestimmt.");

  // ein Recorder-Objekt erzeugen, das auf Toneingang mit dem 
  // Event Handler onaudioprocess reagiert				
  
  // pufferGroesse: the onaudioprocess event is called when the buffer is full
  // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
  var pufferGroesse = 2048;
  var anzEinKanaele = 1;
  var anzAusKanaele = 1;
  if (audioKontext.createScriptProcessor) {
    aufnahmegeraet = audioKontext.createScriptProcessor(pufferGroesse, anzEinKanaele, anzAusKanaele);
  } else {
    aufnahmegeraet = audioKontext.createJavaScriptNode(pufferGroesse, anzEinKanaele, anzAusKanaele);
  }

  // eine Tonquelle vom Mikrofon erzeugen
  tonquelle = audioKontext.createMediaStreamSource(quelle);

  // einige Steuerungsvariablen initialisieren        
  startZeit = Date.now();
  stille = true;
  datenVorhanden = false;
  pausenLaenge = 0.0;
  gemesseneZeit = 0;
  mitschnittFortsetzen = true;

  // die vom Mikrofon 'angelieferten' Tonproben im Puffer kanaldaten speichern
  // und pruefen, ob es sich um Ton oder eine Pause handelt.
  // Die Sprechpausen steuern die weitere Verarbeitung des Inhalts 
  // von kanaldaten
  aufnahmegeraet.onaudioprocess = function (quelle) {
    var ton = quelle.inputBuffer.getChannelData(0);
    if (mitschnittFortsetzen) {
      kanaldaten.push(new Float32Array(ton));
      abtastRate = quelle.inputBuffer.sampleRate;
      aufnahmeLaenge += pufferGroesse;
    }
    steuerung(ton);
  };

  // den Recorder mit der Tonquelle verbinden		    
  tonquelle.connect(aufnahmegeraet);

  // das Ziel der Tonausgabe mit dem Recorder verbinden
  aufnahmegeraet.connect(audioKontext.destination);
}

/*
 nach jedem onaudioprocess-Ereignis wird geprueft, ob 
 gerade gesprochen oder ob eine Sprechpause gemacht 
 wird. Kuerzere Sprechpausen loesen eine Uebermittlung 
 zum zentralen Dienst fuer die Spracherkennung aus. 
 Eine laengere Sprechpause setzt den Mitschnitt aus 
 bis wieder Ton kommt, das Mikrofon bleibt aber offen, 
 damit weiterer Ton erkannt wird.
 */
function steuerung(ton) {
  // den Puffer mit den Lauten durchgehen und 
  // die hoechste Lautstaerke ermitteln
  var ltm = 0;
  for (var i = 0; i < ton.length; i++) {
    var lt = Math.abs(ton[i]);
    if (lt > ltm) {
      ltm = lt;
    }
  }
  // wenn der Ton groesser als 0.10 ist, 
  // wird es als Sprechlaut verarbeitet, 
  // leisere Toene werden als Sprechpause behandelt
  if (ltm > 0.10) {
    if (stille) {
      // Uebergang von Pause zu Ton
      datenVorhanden = true;
      mitschnittFortsetzen = true;
    }
    stille = false;
  } else {
    if (!stille) {
      // Uebergang von Ton zur Pause
      startZeit = Date.now();
    } else {
      // wir sind schon in einer Pause, 
      // pruefen, ob Daten gesendet 
      // werden koennen oder die Aufnahme beendet 
      // werden kann
      gemesseneZeit = Date.now() - startZeit;
      pausenLaenge = gemesseneZeit / 1000;
      if (pausenLaenge > 0.05) {
        if (datenVorhanden) {
          datenVorhanden = false;
          mitschnittSenden();
        } else {
          if (pausenLaenge > 0.3) {
            // hier wird bei offenem Mikrofon die Aufzeichnung unterbrochen
            // bis wieder Ton kommt										
            mitschnittFortsetzen = false;
          }
        }
      }
    }
    stille = true;
  }
}

/*

 Der vorkonfigurierte 'dockerisierte' 
 Vosk-Server antwortet  
 auf einzelne Teile von Sprache nur mit 'Partial' 
 Transskriptionen, so lange diese ueber dieselbe 
 offene Websocket-Verbindung gesendet werden.
 
 Das kann geandert werden, wenn mit einer eigenen 
 und noetigenfalls ebenso containerisierten 
 Konfiguration der Server-Seite gearbeitet wird. 

 Um den Einsatz des momentan von Vosk erhaeltlichen 
 dockerisierten Servers zu zeigen wird in dieser 
 Demo stattdessen jeder Sendevorgang ueber 
 eine eigens eroeffnete WebSocket-Verbindung 
 geschickt.

 */
function mitschnittSenden() {
  var url = document.querySelector('#url');
  var webSocket = new WebSocket(url.value);

  // Audio senden, sobald die Verbindung hergestellt ist
  webSocket.onopen = event => {
    var bitDepth = 16;
    var bytesJeProbe = bitDepth / 8;
    var audioPuffer = zuFloat(kanaldaten, aufnahmeLaenge);
    var puffer = new ArrayBuffer(audioPuffer.length * bytesJeProbe);
    var wav = new DataView(puffer);
    floatZu16BitPCM(wav, 0, audioPuffer);
    webSocket.send('{ "config" : { "sample_rate" : ' + abtastRate + ' } }');
    webSocket.send(wav);
    webSocket.send('{"eof" : 1}');
    console.log('wav gesendet');
    kanaldaten = [];
    aufnahmeLaenge = 0;
  };

  // Antwort vom Vosk Server anzeigen
  webSocket.onmessage = event => {
    console.log(event.data);
    var ergebnis = JSON.parse(event.data);
    var elem = document.querySelector('.ergebnis');
    var text = elem.innerHTML;
    var eText = ergebnis.text;
    if (eText !== undefined) {
      if (text.length > 0) {
        elem.innerHTML = text + '<br/>' + eText;
      } else {
        elem.innerHTML = eText;
      }
      elem.scrollTop = elem.scrollHeight;
    }
  };

  // Fehler bei der WebSocket-Verbindung signalisieren
  webSocket.onerror = event => {
    console.error("WebSocket Fehler:", event);
    document.querySelector('.wsinfo').textContent = 'Fehler';
  };
}

/*
 * Aufnahmedaten in ein Array aus Fliesskommazahlen 
 * uebertragen
 */
function zuFloat(kanalPuffer, aufnahmeLaenge) {
  var result = new Float32Array(aufnahmeLaenge);
  var offset = 0;
  for (var i = 0; i < kanalPuffer.length; i++) {
    var buffer = kanalPuffer[i];
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

/*
 * Der Vosk-Server benoetigt 16 Bit Mono WAV 
 * (Pulse Code Modulation, PCM)
 */
function floatZu16BitPCM(ausgabe, pos, eingabe) {
  for (var i = 0; i < eingabe.length; i++, pos += 2) {
    var s = Math.max(-1, Math.min(1, eingabe[i]));
    ausgabe.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}