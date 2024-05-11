let grid1,
  grid2,
  cellHeight,
  cellWidth,
  prevCoordinates,
  startTime,
  coordinates = [];

const numColumns = 15;
const numRows = 14;
const fixationTime = 500;

function setPage(a) {
  const pages = ["home-page", "eye-tracker-page", "gaze-path-page"];
  for (let i = 0; i < pages.length; i++) {
    if (i === a) {
      this.document.getElementById(pages[i]).style.display = "block";
    } else {
      this.document.getElementById(pages[i]).style.display = "none";
    }
  }
}

function PlotGaze(GazeData) {
  var x = GazeData.docX;
  var y = GazeData.docY;
  const start_tracking = sessionStorage.getItem("start_tracking");
  // console.log(start_tracking);
  if (start_tracking === "true") {
    storeCoordinates(x, y);
  }
}

window.addEventListener("load", function () {
  setPage(0);
  setup();
  this.sessionStorage.setItem("start_tracking", "false");
  GazeCloudAPI.OnCalibrationComplete = function () {
    document.getElementById("calib-comp").style.display = "block";
    document.getElementById("start-calib").innerText = "Recalibrate";
    document.getElementById("go-to-eye-tracker").style.display = "block";
    document.getElementById("gaze-point").style.display = "block";
  };
  GazeCloudAPI.OnCamDenied = function () {
    console.log("camera access denied");
  };
  GazeCloudAPI.OnError = function (msg) {
    console.log("err: " + msg);
  };
  GazeCloudAPI.OnResult = PlotGaze;
});

function startEyeTracking() {
  GazeCloudAPI.StartEyeTracking();
}

function stopEyeTracking() {
  GazeCloudAPI.StopEyeTracking();
}

function goToEyeTracker() {
  setPage(1);
  createGrid(grid1);
}

function startTracker() {
  startTime = new Date().getTime();
  sessionStorage.setItem("start_tracking", "true");
}

function goToGazePath() {
  sessionStorage.setItem("start_tracking", "false");
  stopEyeTracking();
  setPage(2);
  createGrid(grid2);
  draw(coordinates);
}

function setup() {
  grid1 = document.getElementById("grid1");
  grid2 = document.getElementById("grid2");

  cellWidth = window.innerWidth / numColumns;
  cellHeight = window.innerHeight / numRows;

  prevCoordinates = {
    i: 0,
    j: 0,
  };
}

function createGrid(grid) {
  grid.style.gridTemplateColumns = `repeat(${numColumns},${cellWidth}px)`;
  grid.style.gridTemplateRows = `repeat(${numRows}, ${cellHeight}px)`;
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numColumns; j++) {
      const div = document.createElement("div");
      div.classList.add(`grid-item${j}${i}`);
      grid.appendChild(div);
    }
  }
}

function storeCoordinates(x, y) {
  const i = Math.floor(x / cellWidth);
  const j = Math.floor(y / cellHeight);

  // document.getElementById("gaze-point").style.top = y + "px";
  // document.getElementById("gaze-point").style.left = x + "px";

  if (i !== prevCoordinates.i || j !== prevCoordinates.j) {
    let endTime = new Date().getTime();
    let timeDiff = endTime - startTime;
    if (timeDiff > fixationTime) {
      coordinates.push({
        i: prevCoordinates.i,
        j: prevCoordinates.j,
        time: timeDiff / 1000,
      });
    }
    prevCoordinates.i = i;
    prevCoordinates.j = j;
    startTime = new Date().getTime();
  }
}

function draw(coordinates) {
  const parent = document.getElementById("parent2");
  const canvas = document.getElementById("canvas");
  const parRect = parent.getBoundingClientRect();
  canvas.width = parRect.width;
  canvas.height = parRect.height;
  const ctx = canvas.getContext("2d");

  function addPoint(x, y, time,i) {
    const point = document.createElement("div");
    const x_ = document.createElement("span");
    x_.classList.add("fixation-times");
    x_.innerText = time + "s";
    x_.style.top = y + 7 + "px";
    x_.style.left = x + 7 + "px";

    point.classList.add("fixation-points");
    point.style.top = y + "px";
    point.style.left = x + "px";
    point.innerText=i+1;

    parent.appendChild(point);
    parent.appendChild(x_);
  }

  if (coordinates.length > 0) {
    const x0 = coordinates[0].i * cellWidth + cellWidth / 2;
    const y0 = coordinates[0].j * cellHeight + cellHeight / 2;
    addPoint(x0, y0, 1.37,0);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < coordinates.length; i++) {
      const time = coordinates[i].time;
      const x = coordinates[i].i * cellWidth + cellWidth / 2;
      const y = coordinates[i].j * cellHeight + cellHeight / 2;
      addPoint(x, y, time,i);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }
}
