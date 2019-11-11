const characterData = require('character/js/characterData');
const utils = require('utils');

let characterUI;

let currentPlayer = mp.players.local;

let playerCamera,
    playerTempCamera;

let isEdit = false;

const DEFAULT_SIMILARITY = 0.5;

mp.events.add('showCharacterCreator', (skinJson) => {
    if (skinJson) {
        utils.fadeScreen(() => {
            showEditor();
            isEdit = true;
            characterUI.execute("character = " + skinJson);
        }, 1000);
    } else {
        showEditor();
    }
});

mp.events.add('changeHair', (number, gender) => {
    const hairId = characterData.hairList[gender][number].ID;
    currentPlayer.setComponentVariation(2, hairId, 0, 2);
});

mp.events.add('changeZoom', (index) => {
    setCamera(index, true);
});

mp.events.add('changeModelAngle', (angle) => {
    currentPlayer.setHeading(angle);
});

mp.events.add('changeFeature', (index, value) => {
    currentPlayer.setFaceFeature(index, value);
});

mp.events.add('resetCharacter', () => {
    setCamera(1, false);

    mp.events.callRemote("changeGenderInServer", 0);
});

mp.events.add("changeColor", (index, count, name, color, highlightColor) => {
    switch (name) {
        case "eyes": {
            currentPlayer.setEyeColor(color);
            break;
        }
        case "hair": {
            currentPlayer.setHairColor(color, highlightColor);
            break;
        }
        default: {
            currentPlayer.setHeadOverlay(index, count, 1, color, 0);
            break;
        }
    }
});

mp.events.add("changeAppearance", (index, count, color) => {
    currentPlayer.setHeadOverlay(index, count, 1, color, 0); //ДОРОБИТИ ОПАСИТИ
});

mp.events.add("saveCharacterInClient", (json) => {
    const timeout = isEdit ? 1000 : 700;

    characterUI.destroy();
    mp.gui.cursor.show(false, false);
    utils.fadeScreen(() => {
        mp.events.callRemote("saveCharacterInServer", json);
        hideEditor();
    }, timeout);
});

mp.events.add("changeParents", (mother, father, similarity) => {
    currentPlayer.setHeadBlendData(characterData.mothers[mother], characterData.fathers[father], 0,
        characterData.mothers[mother], characterData.fathers[father], 0, similarity, similarity, 0.0, false);
});


mp.events.add("changeGenderInClient", (number) => {
    setCamera(1, false);

    mp.events.callRemote("changeGenderInServer", number);
});

mp.events.add("changeHead", (gender) => {
    const similarityTo = (gender === 0) ? 0 : 100;

    currentPlayer.setHeadBlendData(characterData.fathers[0], characterData.mothers[0], 0, characterData.fathers[0], characterData.mothers[0], 0,
        similarityTo, similarityTo, 0.0, false);

    for (let i = 0; i < 5; i++) {
        currentPlayer.setComponentVariation(characterData.creatorClothes[gender][i].index, characterData.creatorClothes[gender][i].clothes, 0, 2);
    }
});


function setCamera(index) {
    const nullIndex = (index === 0) ? 2 : index - 1;

    if(playerTempCamera) {
        playerTempCamera.setActive(false);
        playerTempCamera.destroy(true);
    }

    playerCamera.destroy(true);

    playerTempCamera = mp.cameras.new("creatorCamera", characterData.cameraCoords[nullIndex].camera, new mp.Vector3(0, 0, 0), characterData.cameraCoords[nullIndex].fov);
    playerTempCamera.pointAtCoord(characterData.cameraCoords[nullIndex].X, characterData.cameraCoords[nullIndex].Y, characterData.cameraCoords[nullIndex].Z);

    playerCamera = mp.cameras.new("creatorCamera", characterData.cameraCoords[index].camera, new mp.Vector3(0, 0, 0), characterData.cameraCoords[index].fov);
    playerCamera.pointAtCoord(characterData.cameraCoords[index].X, characterData.cameraCoords[index].Y, characterData.cameraCoords[index].Z);

    playerCamera.setActiveWithInterp(playerTempCamera.handle, 2000, 0, 0);
}

function hideEditor() {
    mp.gui.chat.activate(true);
    mp.gui.chat.show(true);
    mp.game.ui.displayRadar(true);
    mp.game.ui.displayHud(true);

    currentPlayer.freezePosition(false);

    if(playerTempCamera) playerTempCamera.destroy(true);
    playerCamera.destroy(true);

    mp.game.cam.renderScriptCams(false, false, 0, true, false);

    if (isEdit) {
        currentPlayer.position = currentPlayer.preCreatorPos;
        currentPlayer.setHeading(currentPlayer.preCreatorHeading);
        isEdit = false;
    } else {
        mp.events.call("gotoChoseWayInClient");
    }
}

function showEditor() {
    currentPlayer.preCreatorPos = currentPlayer.position;
    currentPlayer.preCreatorHeading = currentPlayer.getHeading();

    currentPlayer.position = characterData.creatorPlayerPos;
    currentPlayer.setHeading(characterData.creatorPlayerHeading);

    characterUI = mp.browsers.new("package://character/index.html");

    playerCamera = mp.cameras.new("creatorCamera", characterData.cameraCoords[1].camera, new mp.Vector3(0, 0, 0), characterData.cameraCoords[1].fov);
    playerCamera.pointAtCoord(characterData.cameraCoords[1].X, characterData.cameraCoords[1].Y, characterData.cameraCoords[1].Z);

    playerCamera.setActive(true);

    mp.gui.chat.activate(false);
    mp.gui.chat.show(false);
    mp.game.ui.displayRadar(false);
    mp.game.ui.displayHud(false);
    mp.players.local.clearTasksImmediately();
    mp.players.local.freezePosition(true);
    characterUI.active = true;

    mp.game.cam.renderScriptCams(true, false, 0, true, false);

    mp.gui.cursor.show(true, true);

    currentPlayer.setHeadBlendData(characterData.mothers[0], characterData.fathers[0], 0, characterData.mothers[0], characterData.fathers[0], 0, DEFAULT_SIMILARITY, DEFAULT_SIMILARITY, 0.0, false);
}