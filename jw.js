// --- User Profile/Login Logic ---
let currentUser = null;
function showLoginModal() {
  document.getElementById('loginModal').style.display = 'flex';
  document.getElementById('mainContainer').style.display = 'none';
}
function hideLoginModal() {
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('mainContainer').style.display = '';
}
function renderUserHeader() {
  const header = document.getElementById('userHeader');
  if (!currentUser) {
    header.style.display = 'none';
    return;
  }
  header.style.display = '';
  header.innerHTML = `
    <div style="background:#223a5f;color:#fff;padding:14px 0 12px 0;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:1.1em;font-weight:bold;margin-left:24px;">Logged in as <span style='color:#2ecc40;'>${currentUser}</span></div>
      <div style="position:relative;margin-right:24px;">
        <button id="userMenuBtn" style="background:none;border:none;color:#fff;font-size:1.2em;cursor:pointer;padding:0 8px;">&#9776;</button>
        <div id="userDropdown" style="display:none;position:absolute;right:0;top:32px;background:#fff;color:#223a5f;border-radius:8px;box-shadow:0 2px 8px #0002;min-width:160px;z-index:10;">
          <div class="user-menu-item" id="menuStartWorkout" style="padding:12px 18px;cursor:pointer;">Start Workout</div>
          <div class="user-menu-item" id="menuViewHistory" style="padding:12px 18px;cursor:pointer;">View Workout History</div>
          <div class="user-menu-item" id="menuLogout" style="padding:12px 18px;cursor:pointer;color:#e74c3c;">Log Out</div>
        </div>
      </div>
    </div>
  `;
  // Dropdown logic
  const btn = document.getElementById('userMenuBtn');
  const dd = document.getElementById('userDropdown');
  btn.onclick = e => {
    dd.style.display = dd.style.display === 'block' ? 'none' : 'block';
    e.stopPropagation();
  };
  document.body.onclick = () => { dd.style.display = 'none'; };
  document.getElementById('menuStartWorkout').onclick = () => {
    document.getElementById('mainContainer').style.display = '';
    dd.style.display = 'none';
    // Optionally scroll to workout section
  };
  document.getElementById('menuViewHistory').onclick = () => {
    dd.style.display = 'none';
    showHistoryModal();
  };
// --- Workout History Modal ---
function getUserHistory() {
  if (!currentUser) return [];
  try {
    const raw = localStorage.getItem('jw_history_' + currentUser);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveUserHistory(workout) {
  if (!currentUser) return;
  const history = getUserHistory();
  history.unshift(workout); // newest first
  localStorage.setItem('jw_history_' + currentUser, JSON.stringify(history));
}

function showHistoryModal() {
  let modal = document.getElementById('historyModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'historyModal';
    modal.style = 'display:flex;position:fixed;z-index:3000;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);align-items:center;justify-content:center;';
    modal.innerHTML = `<div id="historyModalInner" style="background:#fff;max-width:420px;width:90vw;margin:auto;border-radius:12px;box-shadow:0 4px 24px #0003;padding:32px 24px 24px 24px;position:relative;max-height:80vh;overflow-y:auto;">
      <div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;'>
        <h3 style='margin:0;color:#223a5f;'>Workout History</h3>
        <button id='closeHistoryBtn' aria-label='Close' style='background:none;border:none;font-size:1.7em;color:#888;cursor:pointer;line-height:1;'>&times;</button>
      </div>
      <div id='historyList'></div>
      <div id='historyDetail' style='display:none;'></div>
    </div>`;
    document.body.appendChild(modal);
  }
  const history = getUserHistory();
  const listDiv = modal.querySelector('#historyList');
  const detailDiv = modal.querySelector('#historyDetail');
  detailDiv.style.display = 'none';
  listDiv.style.display = '';
  if (!history.length) {
    listDiv.innerHTML = `<div style='color:#888;text-align:center;margin:32px 0;'>No workouts found.</div>`;
  } else {
    listDiv.innerHTML = `<ul style='list-style:none;padding:0;margin:0;'>${history.map((w, i) => `
      <li style='padding:12px 0;border-bottom:1px solid #eee;cursor:pointer;' data-idx='${i}'>
        <div style='font-weight:bold;color:#223a5f;'>${w.date ? new Date(w.date).toLocaleString() : 'Unknown Date'}</div>
        <div style='font-size:0.98em;color:#555;'>${w.exercises.length} exercises, ${w.totalSets} sets, ${w.totalReps} reps</div>
      </li>`).join('')}</ul>`;
    // Click handler for each workout
    listDiv.querySelectorAll('li[data-idx]').forEach(li => {
      li.onclick = function() {
        const idx = +this.getAttribute('data-idx');
        showHistoryDetail(history[idx], () => showHistoryModal());
      };
    });
  }
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  modal.querySelector('#closeHistoryBtn').onclick = function() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
}

function showHistoryDetail(workout, backFn) {
  const modal = document.getElementById('historyModal');
  const listDiv = modal.querySelector('#historyList');
  const detailDiv = modal.querySelector('#historyDetail');
  listDiv.style.display = 'none';
  detailDiv.style.display = '';
  detailDiv.innerHTML = `
    <button id='backToListBtn' style='background:none;border:none;color:#223a5f;font-size:1em;cursor:pointer;margin-bottom:8px;'>&larr; Back</button>
    <h3 style='margin:0 0 8px 0;color:#223a5f;'>Workout Details</h3>
    <div style='font-size:0.98em;color:#555;margin-bottom:8px;'><b>Date:</b> ${workout.date ? new Date(workout.date).toLocaleString() : 'Unknown'}</div>
    <table style='width:100%;border-collapse:collapse;margin-bottom:18px;'>
      <tr>
        <th style='text-align:left;background:#f0f4f8;'>Exercise</th>
        <th style='text-align:left;background:#f0f4f8;'>Target</th>
        <th style='text-align:left;background:#f0f4f8;'>Actual</th>
      </tr>
      ${workout.exercises.map(e => `
        <tr>
          <td style='vertical-align:top;'>${e.name}<div style='color:#888;font-size:0.95em;'>${e.type ? e.type + ', ' : ''}${e.muscle}</div></td>
          <td style='vertical-align:top;'>Sets: <b>${e.targetSets}</b><br>Reps: <b>${e.targetReps}</b><br>Weight: <b>${e.targetWeight ? e.targetWeight + ' lbs' : '-'}</b></td>
          <td style='vertical-align:top;'>Sets: <b>${e.actualSets || '-'}</b><br>Reps: <b>${e.actualReps || '-'}</b><br>Weight: <b>${e.actualWeight ? e.actualWeight + ' lbs' : '-'}</b></td>
        </tr>
      `).join('')}
    </table>
  `;
  detailDiv.querySelector('#backToListBtn').onclick = function() {
    detailDiv.style.display = 'none';
    listDiv.style.display = '';
  };
}
  document.getElementById('menuLogout').onclick = () => {
    currentUser = null;
    header.style.display = 'none';
    showLoginModal();
  };
}

window.addEventListener('DOMContentLoaded', () => {
  // Show login modal on load
  showLoginModal();
  // Login form handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.onsubmit = function(e) {
      e.preventDefault();
      let username = '';
      if (e.target.elements['username']) {
        username = e.target.elements['username'].value.trim();
      }
      if (!username) username = 'Guest';
      currentUser = username;
      hideLoginModal();
      renderUserHeader();
    };
  }
  // Signup form handler (if present)
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.onsubmit = function(e) {
      e.preventDefault();
      let username = '';
      if (e.target.elements['username']) {
        username = e.target.elements['username'].value.trim();
      }
      if (!username) username = 'Guest';
      currentUser = username;
      hideLoginModal();
      renderUserHeader();
    };
  }
});

// CSV data (from attachments, inlined for browser use)
const csvs = {
  weightlifting: `Type,Muscle Group,Exercise\nPush,Chest,Push-Ups\nPush,Chest,Dumbbell Bench Press\nPush,Chest,Barbell Bench Press\nPush,Chest,Incline Dumbbell Press\nPush,Chest,Machine Chest Press\nPush,Chest,Cable Chest Flyes\nPush,Chest,Pec Deck Machine (Chest Flyes)\nPush,Shoulders,Overhead Shoulder Press (DB or Barbell)\nPush,Shoulders,Arnold Press\nPush,Shoulders,Lateral Raises\nPush,Shoulders,Seated Dumbbell Shoulder Press\nPush,Triceps,Dips (Bench or Machine)\nPush,Triceps,Close-Grip Push-Ups\nPush,Triceps,Overhead Tricep Extension (DB or Cable)\nPush,Triceps,Skull Crushers (EZ Bar or DB)\nPull,Back,Lat Pulldown\nPull,Back,Assisted Pull-Ups\nPull,Back,Dumbbell Rows\nPull,Back,Barbell Rows\nPull,Back,Seated Cable Row\nPull,Back,Inverted Rows\nPull,Back,Pull-Up (Unassisted)\nPull,Back,Cable Straight-Arm Pulldown\nPull,Back,T-Bar Row\nPull,Back,Single-Arm Cable Row\nPull,Rear Shoulders,Face Pulls\nPull,Biceps,Hammer Curls\nPull,Biceps,Barbell Curls\nPull,Biceps,Preacher Curls\nPull,Biceps,Concentration Curls\nPull,Biceps,Incline DB Curls\nLegs,Quads,Bodyweight Squats\nLegs,Quads,Goblet Squats\nLegs,Quads,Barbell Back Squat\nLegs,Quads,Leg Press Machine\nLegs,Quads,Leg Extensions (Machine)\nLegs,Quads,Step-Ups\nLegs,Quads,Bulgarian Split Squat\nLegs,Hamstrings,Dumbbell Lunges\nLegs,Hamstrings,Walking Lunges\nLegs,Hamstrings,Romanian Deadlifts\nLegs,Hamstrings,Leg Curls (Machine)\nLegs,Glutes,Glute Bridges\nLegs,Glutes,Hip Thrusts\nLegs,Glutes,Sumo Squats\nLegs,Calves,Calf Raises (Standing or Seated)\nArms,Triceps,Overhead Tricep Extension (DB or Cable)\nArms,Triceps,Skull Crushers (EZ Bar or DB)\nArms,Triceps,Tricep Pushdowns\nArms,Biceps,Barbell Curls\nArms,Biceps,Incline DB Curls\nArms,Biceps,Hammer Curls\nArms,Biceps,Preacher Curls\nArms,Biceps,Concentration Curls\nArms,Triceps,Dips (Bench or Machine)\nArms,Triceps,Close-Grip Push-Ups\nChest,Chest,Push-Ups\nChest,Chest,Incline Push-Ups\nChest,Chest,Dumbbell Bench Press\nChest,Chest,Barbell Bench Press\nChest,Chest,Machine Chest Press\nChest,Chest,Incline Machine Press\nChest,Chest,Cable Chest Flyes\nChest,Chest,Low to High Cable Flyes\nChest,Chest,Pec Deck Machine (Chest Flyes)\nChest,Chest,Single-Arm Cable Chest Press\nBack,Back,Barbell Bent-Over Rows\nBack,Back,Dumbbell Rows\nBack,Back,Lat Pulldown\nBack,Back,Pull-Up (Unassisted)\nBack,Back,Seated Cable Row\nBack,Back,T-Bar Row\nBack,Back,Machine Row (Hammer Strength)\nBack,Back,Assisted Pull-Ups\nBack,Back,Inverted Rows\nBack,Rear Shoulders,Reverse Flyes`,
  cardio: `Type,Muscle Group,Exercise\nEndurance,Full Body,Jogging (Treadmill or Outdoor)\nEndurance,Legs/Cardio,Cycling (Indoor or Road)\nEndurance,Full Body,Rowing Machine (Steady Pace)\nEndurance,Full Body,Elliptical Trainer\nEndurance,Legs,Incline Walking\nEndurance,Full Body,Swimming (Freestyle or Laps)\nEndurance,Core/Cardio,Jump Rope (Sustained Rounds)\nSpeed,Legs/Power,Sled Sprints\nSpeed,Legs/Cardio,Track Sprints (60m–400m)\nSpeed,Full Body,Assault Bike Sprints\nSpeed,Core/Legs,High Knee Sprints (on the spot)\nSpeed,Full Body,Jump Rope (Sprint Intervals)\nSpeed,Legs/Glutes,Resistance Band Sprints\nQuickness,Legs,Line Hops (Front/Back or Side-to-Side)\nQuickness,Legs/Arms,Jump Rope Speed Drills\nQuickness,Core/Legs,Fast Feet in Place\nQuickness,Legs,Mini-Hurdle Steps\nQuickness,Core,Toe Taps (on low platform)\nAgility,Legs/Core,Agility Ladder (Various Patterns)\nAgility,Legs/Core,Side Shuffle Cone Drills\nAgility,Full Body,Cone Shuttle Drills\nAgility,Legs,Pro Agility Drill (5-10-5)\nAgility,Full Body,Dot Drills\nHIIT,Full Body,Battle Rope Slams (Timed Intervals)\nHIIT,Full Body,Burpees\nHIIT,Legs/Cardio,Squat Jumps\nHIIT,Full Body,Mountain Climbers\nHIIT,Cardio/Core,Bike or Rower (30s sprint / 90s rest)\nHIIT,Legs,Jump Lunges\nPlyometrics,Legs,Box Jumps\nPlyometrics,Legs,Bounding (Long Jumps)\nPlyometrics,Legs,Hurdle Hops\nPlyometrics,Legs/Glutes,Depth Jumps\nPlyometrics,Legs,Skater Jumps\nMobility/Recovery,Full Body,Dynamic Stretch Flow\nMobility/Recovery,Legs,Walking Lunges with Reach\nMobility/Recovery,Full Body,Crawling Patterns\nMobility/Recovery,Core/Yoga,Standing Cardio Flow (low-impact)`,
  functional: `Muscle Group,Exercise\nFull Body,Kettlebell Swings\nFull Body,Burpees\nFull Body,Battle Ropes\nFull Body,Farmer’s Carries\nFull Body,Jump Squats\nFull Body,Wall Balls\nFull Body,Mountain Climbers\nFull Body,Box Jumps\nFull Body,Medicine Ball Slams\nFull Body,Bodyweight Circuits\nFull Body,Turkish Get-Up\nFull Body,Renegade Rows\nFull Body,Jump Rope (HIIT Rounds)\nFull Body,Kettlebell Cleans & Press\nFull Body,Man Makers\nCore/Shoulders,Bear Crawls\nLegs/Glutes,Banded Lateral Walks\nBack/Core,Deadlifts (moderate weight)\nLegs/Core,Walking Lunges (Loaded)\nFull Body,Rowing Machine (Intervals)\nHamstrings/Glutes,Single-Leg RDL\nHamstrings/Glutes,Kettlebell RDL\nGlutes/Quads,Goblet Squat\nGlutes/Core,Front-Racked Kettlebell Lunge\nQuads/Glutes,Bulgarian Split Squat\nFull Body,Turkish Get-Up\nGlutes/Hamstrings,Barbell Hip Thrust\nLegs/Core,Lateral Lunge\nGlutes/Core,Kettlebell Swing\nCore/Back,Deadlifts (Moderate Weight)\nCore/Shoulders,Bear Crawls\nCore/Back,Loaded Carries (Farmer’s / Suitcase)\nShoulders/Core,Landmine Press\nShoulders,Half-Kneeling Overhead Press\nChest/Shoulders,Push-Up to T\nChest/Core,Push-Up + Shoulder Tap\nChest/Shoulders,Incline Push-Ups\nCore,Plank Pull-Through\nCore,Med Ball Slam\nCore,Med Ball Russian Twists\nCore,Hanging Knee Raises\nCore/Hips,Dead Bug\nCore/Obliques,Rotational Landmine Twist\nCore/Obliques,Cable Woodchoppers\nCore/Obliques,Banded Rotational Press\nShoulders/Back,Renegade Row\nBack/Biceps,Single-Arm Dumbbell Row\nLegs/Cardio,Battle Rope Slams\nFull Body,Battle Rope Alternating Waves\nFull Body,Box Jumps\nLegs/Cardio,Jump Squats\nFull Body,Burpees\nBack/Cardio,Rowing Machine Intervals\nLegs/Core,Step-Ups with Knee Drive\nShoulders/Arms,Wall Balls\nLegs/Glutes,Walking Kettlebell Lunge\nCore/Cardio,Mountain Climbers\nCardio/Arms,Jump Rope (HIIT Intervals)\nShoulders/Core,Sled Push (if available)\nGlutes/Shoulders,Banded Lateral Walks`
};

function parseCSV(csv, hasType = true) {
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        let obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim() || '');
        return obj;
    });
}

const data = {
    weightlifting: parseCSV(csvs.weightlifting, true),
    cardio: parseCSV(csvs.cardio, true),
    functional: parseCSV(csvs.functional, false)
};

const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const planDiv = document.getElementById('plan');
let selectedWorkout = '';
let selectedOption = '';
let selectedValues = [];

document.getElementById('workoutType').addEventListener('change', function() {
    selectedWorkout = this.value;
    step2.innerHTML = '';
    step3.innerHTML = '';
    planDiv.style.display = 'none';
    if (selectedWorkout === 'weightlifting' || selectedWorkout === 'cardio') {
        step2.style.display = '';
        step2.innerHTML = `
            <label>Choose by:</label>
            <button id="chooseType">Type</button>
            <button id="chooseMuscle">Muscle Group</button>
        `;
        document.getElementById('chooseType').onclick = () => showOptions('type');
        document.getElementById('chooseMuscle').onclick = () => showOptions('muscle');
    } else if (selectedWorkout === 'functional') {
        // Only muscle group for functional
        showOptions('muscle');
    }
});

function getUnique(field, arr) {
    return [...new Set(arr.map(x => x[field]).filter(Boolean))].sort();
}

function showOptions(option) {
    selectedOption = option;
    step3.innerHTML = '';
    planDiv.style.display = 'none';
    let opts = [];
    if (selectedWorkout === 'weightlifting' || selectedWorkout === 'cardio') {
        if (option === 'type') {
            opts = getUnique('Type', data[selectedWorkout]);
        } else {
            opts = getUnique('Muscle Group', data[selectedWorkout]);
        }
    } else if (selectedWorkout === 'functional') {
        opts = getUnique('Muscle Group', data.functional);
    }
    step3.style.display = '';
    step3.innerHTML = `
        <label>Select ${option === 'type' ? 'Type(s)' : 'Muscle Group(s)'}:</label>
        <div id="optionCheckboxes" style="margin-bottom:16px;">
            ${opts.map(o => `<label style='display:block;'><input type='checkbox' value="${o}"> ${o}</label>`).join('')}
        </div>
        <button id="generatePlan">Generate Plan</button>
    `;
    document.getElementById('generatePlan').onclick = generatePlan;
}

function getRandom(arr, n) {
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

function generatePlan() {
    // Get checked values from checkboxes
    const checkboxes = document.querySelectorAll('#optionCheckboxes input[type=checkbox]:checked');
    selectedValues = Array.from(checkboxes).map(cb => cb.value);
    if (!selectedValues.length) {
        alert('Please select at least one option.');
        return;
    }
    let exercises = [];
    if (selectedOption === 'type') {
        selectedValues.forEach(type => {
            const all = data[selectedWorkout].filter(x => x.Type === type);
            const muscleGroups = getUnique('Muscle Group', all);
            let chosen = [];
            muscleGroups.forEach(mg => {
                const groupExercises = all.filter(x => x['Muscle Group'] === mg);
                chosen = chosen.concat(getRandom(groupExercises, Math.min(2, groupExercises.length)));
            });
            if (chosen.length < 6) {
                const left = all.filter(x => !chosen.includes(x));
                chosen = chosen.concat(getRandom(left, 6 - chosen.length));
            }
            chosen = chosen.slice(0, 8);
            exercises = exercises.concat(chosen);
        });
        if (exercises.length < 6) {
            let allTypeExercises = [];
            selectedValues.forEach(type => {
                allTypeExercises = allTypeExercises.concat(data[selectedWorkout].filter(x => x.Type === type));
            });
            const left = allTypeExercises.filter(x => !exercises.includes(x));
            exercises = exercises.concat(getRandom(left, 6 - exercises.length));
        }
        exercises = getRandom(exercises, Math.max(6, Math.min(10, exercises.length)));
    } else {
        selectedValues.forEach(muscle => {
            const groupExercises = data[selectedWorkout].filter(x => x['Muscle Group'] === muscle);
            exercises = exercises.concat(getRandom(groupExercises, Math.min(2, groupExercises.length)));
        });
        if (exercises.length < 6) {
            let allMuscleExercises = [];
            selectedValues.forEach(muscle => {
                allMuscleExercises = allMuscleExercises.concat(data[selectedWorkout].filter(x => x['Muscle Group'] === muscle));
            });
            const left = allMuscleExercises.filter(x => !exercises.includes(x));
            exercises = exercises.concat(getRandom(left, 6 - exercises.length));
        }
        exercises = getRandom(exercises, Math.max(6, Math.min(10, exercises.length)));
    }
    if (!exercises.length) {
        planDiv.style.display = 'block';
        planDiv.innerHTML = '<b>No exercises found for your selection.</b>';
        return;
    }
    // Show modal with plan
    const modal = document.getElementById('planModal');
    const modalContent = document.getElementById('modalPlanContent');

    // Modal state
    let modalExercises = exercises.map(e => ({...e, _fade: false}));

    function renderModalTable(fadeIdx = null, fadeType = null) {
        modalContent.innerHTML = `<h3 style='margin-top:0;'>Your Exercise Plan</h3>
        <table class='jw-modal-table'>
          <tbody id='modalTableBody'>
            ${modalExercises.map((e, idx) => `
              <tr data-idx='${idx}' class='${e._fade ? (fadeType === 'out' ? 'jw-fade-out jw-strike' : 'jw-fade-in') : ''}'>
                <td style='width:36px;text-align:center;'>
                  <button class='reload-btn${e._spin ? ' jw-spin' : ''}' title='Replace exercise'>
                    <svg viewBox="0 0 20 20" fill="none"><path d="M16.7 7.5A7 7 0 1 0 17 10" stroke="#fff" stroke-width="2"/><path d="M13.5 7V3.5a.5.5 0 0 1 .5-.5H17" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
                  </button>
                </td>
                <td style='width:36px;text-align:center;'>
                  <button class='delete-btn' title='Delete exercise'>
                    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#fff" stroke-width="2"/><path d="M7 7l6 6M13 7l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
                  </button>
                </td>
                <td>${e.Exercise} <span style='color:#888;font-size:0.95em;'>(${e['Type'] ? e['Type'] + ', ' : ''}${e['Muscle Group']})</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style='display:flex;align-items:center;gap:8px;margin-top:18px;'>
          <button id='addExerciseBtn' title='Add exercise' class='jw-add-btn'>
            <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#fff" stroke-width="2"/><path d="M10 5v10M5 10h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
          <span style='color:#2ecc40;font-weight:bold;'>Add Exercise</span>
        </div>`;
        document.getElementById('okModalBtn').disabled = false;
        document.getElementById('okModalBtn').style.opacity = '1';
    }

    function getRandomExerciseForRow(rowIdx) {
        // Get muscle group/type for this row
        const e = modalExercises[rowIdx];
        let pool = [];
        if (selectedOption === 'type') {
            pool = data[selectedWorkout].filter(x => x.Type === e.Type && x['Muscle Group'] === e['Muscle Group'] && !modalExercises.some(me => me.Exercise === x.Exercise));
            if (!pool.length) pool = data[selectedWorkout].filter(x => x.Type === e.Type && !modalExercises.some(me => me.Exercise === x.Exercise));
        } else {
            pool = data[selectedWorkout].filter(x => x['Muscle Group'] === e['Muscle Group'] && !modalExercises.some(me => me.Exercise === x.Exercise));
        }
        if (pool.length) {
            // Spin reload icon, fade out, then replace and fade in
            modalExercises[rowIdx]._spin = true;
            renderModalTable(rowIdx, 'out');
            attachModalHandlers();
            setTimeout(() => {
                modalExercises[rowIdx] = {...getRandom(pool, 1)[0], _fade: true};
                renderModalTable(rowIdx, 'in');
                attachModalHandlers();
                setTimeout(() => {
                    modalExercises[rowIdx]._fade = false;
                    modalExercises[rowIdx]._spin = false;
                    renderModalTable();
                    attachModalHandlers();
                }, 350);
            }, 350);
        }
    }

    function addRandomExercise() {
        // Add a new random exercise from selected muscle group/type not already in list
        let pool = [];
        if (selectedOption === 'type') {
            const type = selectedValues[Math.floor(Math.random() * selectedValues.length)];
            const all = data[selectedWorkout].filter(x => x.Type === type && !modalExercises.some(me => me.Exercise === x.Exercise));
            if (all.length) {
                const newE = getRandom(all, 1)[0];
                modalExercises.push({...newE, _fade: true});
                renderModalTable(modalExercises.length - 1, 'in');
                attachModalHandlers();
                setTimeout(() => {
                    modalExercises[modalExercises.length - 1]._fade = false;
                    renderModalTable();
                    attachModalHandlers();
                }, 350);
            }
        } else {
            const mg = selectedValues[Math.floor(Math.random() * selectedValues.length)];
            const all = data[selectedWorkout].filter(x => x['Muscle Group'] === mg && !modalExercises.some(me => me.Exercise === x.Exercise));
            if (all.length) {
                const newE = getRandom(all, 1)[0];
                modalExercises.push({...newE, _fade: true});
                renderModalTable(modalExercises.length - 1, 'in');
                attachModalHandlers();
                setTimeout(() => {
                    modalExercises[modalExercises.length - 1]._fade = false;
                    renderModalTable();
                    attachModalHandlers();
                }, 350);
            }
        }
    }

    function attachModalHandlers() {
        // Reload
        document.querySelectorAll('.reload-btn').forEach((btn, idx) => {
            btn.onclick = function() {
                modalExercises[idx]._spin = true;
                renderModalTable(idx);
                attachModalHandlers();
                getRandomExerciseForRow(idx);
            };
        });
        // Delete
        document.querySelectorAll('.delete-btn').forEach((btn, idx) => {
            btn.onclick = function() {
                // Fade out row, add strikethrough, then remove
                modalExercises[idx]._fade = true;
                renderModalTable(idx, 'out');
                attachModalHandlers();
                setTimeout(() => {
                    modalExercises.splice(idx, 1);
                    renderModalTable();
                    attachModalHandlers();
                }, 350);
            };
        });
        // Add exercise
        document.getElementById('addExerciseBtn').onclick = function() {
            addRandomExercise();
            renderModalTable();
            attachModalHandlers();
        };
    }

    renderModalTable();
    attachModalHandlers();

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('cancelModalBtn').onclick = function() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      document.getElementById('workoutType').selectedIndex = 0;
      step2.innerHTML = '';
      step2.style.display = 'none';
      step3.innerHTML = '';
      step3.style.display = 'none';
      planDiv.style.display = 'none';
    };
    document.getElementById('okModalBtn').onclick = function() {
      // Show sets/reps form in the modal itself
      const planInputs = modalExercises.map((e, idx) => `
        <tr>
          <td>${e.Exercise} <span style='color:#888;font-size:0.95em;'>(${e['Type'] ? e['Type'] + ', ' : ''}${e['Muscle Group']})</span></td>
          <td><input type='number' min='1' max='99' name='sets${idx}' required style='width:60px;'></td>
          <td><input type='number' min='1' max='99' name='reps${idx}' required style='width:60px;'></td>
          <td><input type='number' min='0' max='999' name='weight${idx}' step='0.1' placeholder='lbs' style='width:70px;'></td>
        </tr>
      `).join('');
      document.getElementById('modalPlanContent').innerHTML = `
        <h3 style='margin-top:0;'>Customize Your Workout</h3>
        <form id='workoutForm'>
          <table style='width:100%;border-collapse:collapse;margin-top:24px;'>
            <tr>
              <th style='text-align:left;background:#f0f4f8;'>Exercise</th>
              <th style='text-align:left;background:#f0f4f8;'>Target Sets</th>
              <th style='text-align:left;background:#f0f4f8;'>Target Reps</th>
              <th style='text-align:left;background:#f0f4f8;'>Target MaxWeight</th>
            </tr>
            ${planInputs}
          </table>
          <div style='display:flex;gap:16px;justify-content:flex-end;margin-top:32px;'>
            <button type='button' id='formCancelBtn' style='background:#888;color:#fff;padding:10px 18px;border:none;border-radius:5px;font-size:1em;'>Cancel</button>
            <button type='submit' id='formBeginBtn' style='background:#2ecc40;color:#fff;padding:10px 18px;border:none;border-radius:5px;font-size:1em;font-weight:bold;'>Begin Workout</button>
          </div>
        </form>
      `;
      document.getElementById('modalPlanActions').style.display = 'none';
      document.getElementById('formCancelBtn').onclick = function() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      };
      document.getElementById('workoutForm').onsubmit = function(e) {
        e.preventDefault();
        // Show workout session page in the modal
        let startTime = Date.now();
        let elapsed = 0;
        let timerInterval = null;
        let paused = false;
        const n = modalExercises.length;
        // Store user actuals
        let actuals = Array(n).fill().map(() => ({sets: '', reps: '', weight: ''}));

        function formatTime(ms) {
          const t = Math.floor(ms / 1000);
          const min = Math.floor(t / 60).toString().padStart(2, '0');
          const sec = (t % 60).toString().padStart(2, '0');
          return `${min}:${sec}`;
        }

        function renderSession() {
          document.getElementById('modalPlanContent').innerHTML = `
            <h3 style='margin-top:0;'>Workout In Progress</h3>
            <div style='font-size:1.3em;font-weight:bold;margin-bottom:18px;'>⏱️ <span id='workoutTimer'>${formatTime(elapsed)}</span></div>
            <table style='width:100%;border-collapse:collapse;'>
              <tr>
                <th style='text-align:left;background:#f0f4f8;'>Exercise</th>
                <th style='text-align:left;background:#f0f4f8;'>Target</th>
                <th style='text-align:left;background:#f0f4f8;'>Actual</th>
              </tr>
              ${modalExercises.map((e, idx) => {
                const done = actuals[idx].sets && actuals[idx].reps && actuals[idx].weight;
                return `
                  <tr${done ? " style='background:#e6faea;'" : ''}>
                    <td style='vertical-align:top;'>
                      <div>${e.Exercise}</div>
                      <div style='color:#888;font-size:0.95em;'>(${e['Type'] ? e['Type'] + ', ' : ''}${e['Muscle Group']})</div>
                    </td>
                    <td style='vertical-align:top;'>
                      <div>Sets: <b>${document.querySelector(`[name=sets${idx}]`)?.value || ''}</b></div>
                      <div>Reps: <b>${document.querySelector(`[name=reps${idx}]`)?.value || ''}</b></div>
                      <div>Weight: <b>${document.querySelector(`[name=weight${idx}]`)?.value || ''} lbs</b></div>
                    </td>
                    <td style='vertical-align:top;'>
                      <input type='number' min='1' max='99' placeholder='Sets' style='width:48px;margin-bottom:2px;' value='${actuals[idx].sets}' data-idx='${idx}' class='actual-sets'>
                      <input type='number' min='1' max='99' placeholder='Reps' style='width:48px;margin-bottom:2px;' value='${actuals[idx].reps}' data-idx='${idx}' class='actual-reps'>
                      <input type='number' min='0' max='999' step='0.1' placeholder='Weight' style='width:60px;' value='${actuals[idx].weight}' data-idx='${idx}' class='actual-weight'>
                    </td>
                  </tr>
                `;
              }).join('')}
            </table>
            <div style='display:flex;gap:12px;justify-content:flex-end;margin-top:28px;'>
              <button id='stopWorkoutBtn' style='background:#e74c3c;color:#fff;padding:10px 18px;border:none;border-radius:5px;font-size:1em;'>Stop Workout</button>
              <button id='pauseWorkoutBtn' style='background:#888;color:#fff;padding:10px 18px;border:none;border-radius:5px;font-size:1em;'>Pause Workout</button>
              <button id='finishWorkoutBtn' style='background:#2ecc40;color:#fff;padding:10px 18px;border:none;border-radius:5px;font-size:1em;font-weight:bold;'>Finish Workout</button>
            </div>
          `;
        }

        function updateTimer() {
          if (!paused) {
            elapsed = Date.now() - startTime;
            const timerEl = document.getElementById('workoutTimer');
            if (timerEl) timerEl.textContent = formatTime(elapsed);
          }
        }

        function attachSessionHandlers() {
          // Actuals input handlers
          document.querySelectorAll('.actual-sets').forEach(inp => {
            inp.oninput = function() {
              const idx = +this.dataset.idx;
              actuals[idx].sets = this.value;
              renderSession();
              attachSessionHandlers();
            };
          });
          document.querySelectorAll('.actual-reps').forEach(inp => {
            inp.oninput = function() {
              const idx = +this.dataset.idx;
              actuals[idx].reps = this.value;
              renderSession();
              attachSessionHandlers();
            };
          });
          document.querySelectorAll('.actual-weight').forEach(inp => {
            inp.oninput = function() {
              const idx = +this.dataset.idx;
              actuals[idx].weight = this.value;
              renderSession();
              attachSessionHandlers();
            };
          });
          // Stop Workout
          document.getElementById('stopWorkoutBtn').onclick = function() {
            clearInterval(timerInterval);
            modal.style.display = 'none';
            document.body.style.overflow = '';
          };
          // Pause/Resume Workout
          document.getElementById('pauseWorkoutBtn').onclick = function() {
            if (!paused) {
              paused = true;
              clearInterval(timerInterval);
              this.textContent = 'Resume Workout';
            } else {
              paused = false;
              startTime = Date.now() - elapsed;
              timerInterval = setInterval(updateTimer, 1000);
              this.textContent = 'Pause Workout';
            }
          };
          // Finish Workout
          document.getElementById('finishWorkoutBtn').onclick = function() {
            clearInterval(timerInterval);
            // Calculate summary
            const totalTime = formatTime(elapsed);
            const numExercises = modalExercises.length;
            let totalSets = 0, totalReps = 0;
            // For each exercise, get max weight (from actuals)
            const exerciseSummaries = modalExercises.map((e, idx) => {
              const sets = parseInt(actuals[idx].sets) || 0;
              const reps = parseInt(actuals[idx].reps) || 0;
              const weight = parseFloat(actuals[idx].weight) || 0;
              totalSets += sets;
              totalReps += reps;
              return {
                name: e.Exercise,
                sets,
                reps,
                weight
              };
            });
            // Save workout to history
            saveUserHistory({
              date: Date.now(),
              totalTime,
              totalSets,
              totalReps,
              exercises: modalExercises.map((e, idx) => ({
                name: e.Exercise,
                type: e.Type || '',
                muscle: e['Muscle Group'] || e['Muscle'] || '',
                targetSets: document.querySelector(`[name=sets${idx}]`)?.value || '',
                targetReps: document.querySelector(`[name=reps${idx}]`)?.value || '',
                targetWeight: document.querySelector(`[name=weight${idx}]`)?.value || '',
                actualSets: actuals[idx].sets,
                actualReps: actuals[idx].reps,
                actualWeight: actuals[idx].weight
              }))
            });
            // Show summary page in modal
            document.getElementById('modalPlanContent').innerHTML = `
              <h3 style='margin-top:0;'>Workout Summary</h3>
              <div style='font-size:1.1em;margin-bottom:12px;'>
                <b>Time:</b> ${totalTime}<br>
                <b>Exercises Completed:</b> ${numExercises}<br>
                <b>Total Sets:</b> ${totalSets}<br>
                <b>Total Reps:</b> ${totalReps}
              </div>
              <table style='width:100%;border-collapse:collapse;margin-bottom:18px;'>
                <tr>
                  <th style='text-align:left;background:#f0f4f8;'>Exercise</th>
                  <th style='text-align:left;background:#f0f4f8;'>Sets</th>
                  <th style='text-align:left;background:#f0f4f8;'>Reps</th>
                  <th style='text-align:left;background:#f0f4f8;'>Max Weight</th>
                </tr>
                ${exerciseSummaries.map(es => `
                  <tr>
                    <td>${es.name}</td>
                    <td>${es.sets}</td>
                    <td>${es.reps}</td>
                    <td>${es.weight ? es.weight + ' lbs' : '-'}</td>
                  </tr>
                `).join('')}
              </table>
              <div style='display:flex;justify-content:flex-end;'>
                <button id='closeSummaryBtn' style='background:#2d3a4b;color:#fff;padding:10px 18px;border:none;border-radius:5px;font-size:1em;'>Close</button>
              </div>
            `;
            document.getElementById('closeSummaryBtn').onclick = function() {
              modal.style.display = 'none';
              document.body.style.overflow = '';
            };
          };
        }

        renderSession();
        attachSessionHandlers();
        timerInterval = setInterval(updateTimer, 1000);
      };
    };
    // Add close button handler
    document.getElementById('closeModalBtn').onclick = function() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    };
}
