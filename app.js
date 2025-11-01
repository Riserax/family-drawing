import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { child, get, getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2jdkHNxzsjFl01ryROP1bKpTINsqEEf0",
  authDomain: "family-drawing.firebaseapp.com",
  projectId: "family-drawing",
  storageBucket: "family-drawing.appspot.com",
  messagingSenderId: "663235592596",
  appId: "1:663235592596:web:ab7a393ed45a01e93f0f81",
  measurementId: "G-ZNY5CLVB1X",
  databaseURL: "https://family-drawing-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase ---------------------------------------------------------------
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const databaseRef = ref(database);

// Populate a person list from database -------------------------------------------------
const populatePersonOptions = () => {
  const selectElement = document.getElementById("person-list");
  if (!selectElement) return;
  // Keep only the first placeholder option
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }

  get(child(databaseRef, 'persons/calki')).then((snapshot) => {
    if (!snapshot.exists()) {
      console.log("No persons available to populate select - creating empty list");
      return set(ref(database, 'persons/calki'), [])
        .catch((err) => console.error(err));
    }

    const data = snapshot.val();
    let people = [];
    if (Array.isArray(data)) {
      people = data.filter(Boolean);
    }

    people.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      selectElement.appendChild(opt);
    });
  }).catch((error) => {
    console.error(error);
  });
};

// Ensure options are populated on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', populatePersonOptions);
} else {
  populatePersonOptions();
}

// Handle form -----------------------------------------------------------------------
const drawingForm = document.getElementById("drawing-form");
const drawingPath = `drawings/${new Date().getFullYear()}/calki`;

drawingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Get person list -----------------------------------------------------------------
  get(child(databaseRef, 'persons/calki')).then((snapshot) => {
    if (snapshot.exists()) {
      const personList = snapshot.val();

      // Get drawing list ------------------------------------------------------------
      get(child(databaseRef, drawingPath)).then((snapshot) => {
        if (!snapshot.exists()) {
          console.log("No drawings available - creating empty list...");
          set(ref(database, drawingPath), '')
              .catch((err) => console.error(err));
          alert("Coś poszło nie tak... Zagłosuj jeszcze raz.");
          window.location.reload();
        }

        const selectedPerson = document.getElementById("person-list").value;
        if (selectedPerson === '') {
          alert("Wybierz osobę z listy");
        } else {
          // Get drawn person list -------------------------------------------------
          const drawingList = snapshot.val();
          let personHasAlreadyDrawn = false;
          let personWhoHasDrawnList = [];
          let personWhoHasBeenDrawnList = [];
          for (let i = 0; i < drawingList.length; i++) {
            const indexOfComma = drawingList[i].indexOf(">");
            const personWhoHasDrawn = drawingList[i].substring(0, indexOfComma);

            if (personWhoHasDrawn === selectedPerson) {
              personHasAlreadyDrawn = true;
              alert("Ta osoba już losowała!");
              window.location.reload();
            }

            personWhoHasDrawnList[i] = personWhoHasDrawn;
            personWhoHasBeenDrawnList[i] = drawingList[i].substring(indexOfComma + 1);
          }
          console.log("Już losowali:");
          console.table(personWhoHasDrawnList);

          addDrawingPersonToDrawnList(personWhoHasBeenDrawnList);

          // Perform drawing ---------------------------------------------------------
          if (!personHasAlreadyDrawn) {
            let randomlyDrawnPerson = getRandomlyDrawnPerson(personList, personWhoHasBeenDrawnList);
            saveDrawing(randomlyDrawnPerson, drawingList);
          }
        }
      }).catch((error) => {
        console.error(error);
      });
    } else {
      console.log("No persons available");
    }
  }).catch((error) => {
    console.error(error);
  });
});

let addDrawingPersonToDrawnList = (drawnPersons) => {
  // Add drawing person so they cannot draw themselves
  const selectedPerson = document.getElementById("person-list").value;
  if (!drawnPersons.includes(selectedPerson)) {
    drawnPersons[drawnPersons.length] = selectedPerson;
  }
}

let getRandomlyDrawnPerson = (personList, drawnPersons) => {
  const freePersons = getAvailablePersons(personList, drawnPersons);
  let randomNumber = Math.floor(Math.random() * freePersons.length);
  return freePersons[randomNumber];
}

let getAvailablePersons = (personList, drawnPersons) => {
  let freePersons = [];
  let freePersonsCount = 0;
  for (let j = 0; j < personList.length; j++) {
    if (!drawnPersons.includes(personList[j])) {
      freePersons[freePersonsCount++] = personList[j];
    }
  }
  return freePersons;
}

let saveDrawing = (randomlyDrawnPerson, drawingList) => {
  const selectedPerson = document.getElementById("person-list").value;
  const drawResult = `${selectedPerson}>${randomlyDrawnPerson}`;
  set(ref(database, `${drawingPath}/${drawingList.length}`), drawResult);
  showDrawingAlert(randomlyDrawnPerson);
}

let showDrawingAlert = (randomlyDrawnPerson) => {
  const drawAlertMessage = `WYLOSOWANA OSOBA:\n\n${randomlyDrawnPerson}\n\nZapamiętaj i nie pokazuj nikomu!`;
  alert(drawAlertMessage);
  window.location.reload();
}
