let cells = [];
let tempo;
let isPlaying = false;
let playheads = [];

function setupCells() {
    for (let i = 0; i < 256; i++) {
        cells.push({})
    }
}

setupCells();

function startSeq() {
    //detect all cells with 'start' block and create a playhead there
    const startCells = cells.filter((cell) => cell.bl == 'start')

    if (startCells) {
        startCells.forEach((startCell) => {
            const startCellIndex = cells.indexOf(startCell);
            createPlayhead(startCell.dir, startCellIndex);
        })

        playStep();
    }
}

function playStep() {
    updateUi();

    if (!isPlaying) return;

    //set new playhead positions
    const activePlayheads = getActivePlayheads();

    activePlayheads.forEach((playhead) => {
        if (playhead.dir === 0) {
            playhead.posX += 1;
        } else if (playhead.dir === 1) {
            playhead.posY += 1;
        } else if (playhead.dir === 2) {
            playhead.posX -= 1;
        } else if (playhead.dir === 3) {
            playhead.posY -= 1;
        };

        const curCell = cells[playhead.posY * 16 + playhead.posX];

        if (playhead.posX > 15 || playhead.posY > 15 || playhead.posX < 0 || playhead.posY < 0 || curCell.bl === 'stop') {
            removePlayhead(playhead);
        } else if (curCell.bl === 'split') {
            createPlayhead(curCell.dir, cells.indexOf(curCell))
        } else if (curCell.bl) {
            playhead.dir = curCell.dir;
        }
    });

    setTimeout(playStep, 60000 / tempo);
};

function stopSeq() {
    isPlaying = false;
    playheads = [];
    console.log("playing stopped");
};

function createPlayhead(dir, index) {
    const posY = Math.floor(index / 16);
    const posX = index - posY * 16;

    playheads.push({ dir: dir, posX: posX, posY: posY })
    console.log(`playhead created: ${dir}, ${posX}, ${posY}`);
};

function removePlayhead(playhead) {
    playhead.isRemoved = true;
};

function getActivePlayheads() {
    return playheads.filter((playhead) => !playhead.isRemoved);
}

//User Interface
//inputs
const inputTempo = document.getElementById("inputTempo");
inputTempo.addEventListener('input', updateTempo);

function updateTempo() {
    tempo = inputTempo.value
}

const btnPlayPause = document.getElementById("btnPlayPause");
btnPlayPause.addEventListener("click", togglePlay);

//controls
function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
        btnPlayPause.classList.add("active");
        console.log("playing");

        if (playheads.length === 0) {
            startSeq();
        } else {
            playStep();
        }
    } else {
        btnPlayPause.classList.remove("active");
    }
};

const btnStop = document.getElementById("btnStop");
btnStop.addEventListener("click", () => {
    if (isPlaying) {
        stopSeq();
        btnPlayPause.classList.remove("active");
    }
});

//block settings
const inputsBlockType = document.querySelectorAll('input[name="blockType"]');
inputsBlockType.forEach((inputBlockType) => {
    inputBlockType.addEventListener('change', updateBlockTypeSelected);
});
let blockTypeSelected;

function updateBlockTypeSelected() {
    blockTypeSelected = document.querySelector('input[name="blockType"]:checked').value;
}

//setup & update
function setupUi() {
    const gridContainer = document.getElementById("gridContainer");
    for (let i = 0; i < 256; i++) {
        const uiCell = document.createElement("div");
        uiCell.id = "cell_" + i;
        uiCell.draggable = false;
        gridContainer.appendChild(uiCell);

        //place blocks
        const cell = cells[i];

        uiCell.addEventListener('mouseover', () => {
            if (!cell.bl) uiCell.classList.add(blockTypeSelected);
        })

        uiCell.addEventListener('mouseout', () => {
            if (!cell.bl) uiCell.classList.remove(blockTypeSelected);
        })

        uiCell.addEventListener('click', () => {
            if (blockTypeSelected == 'erase') {
                uiCell.classList.remove(cell.bl);
                for (const key in cell) {
                    delete cell[key];
                }
            } else if (cell.bl == blockTypeSelected) {
                if (cell.dir < 3) {
                    cell.dir += 1;
                } else {
                    cell.dir = 0;
                }
                uiCell.style.rotate = 90 * cell.dir + 'deg';
            } else {
                cell.dir = 0;
                cell.bl = blockTypeSelected;
            }

            console.log(cell)
        })
    }
    updateTempo();

    blockTypeSelected = 'start';
    document.querySelector('input[value="start"]').checked = true;
}

setupUi();

function updateUi() {
    //clear all active cells
    document.querySelectorAll("#gridContainer > div").forEach(cell => { cell.classList.remove("active"); });

    const activePlayheads = getActivePlayheads();

    activePlayheads.forEach((playhead) => {
        const activeCellId = playhead.posY * 16 + playhead.posX;
        document.getElementById("cell_" + activeCellId).classList.add("active");
    });
}

//Audio