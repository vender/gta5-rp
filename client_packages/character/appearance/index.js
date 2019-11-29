const characterData = require('character/appearance/js/characterData');
const utils = require('utils');

let characterUI;

let currentPlayer = mp.players.local;

let playerCamera;

let isEdit = false;
let camIndex = 1;

const DEFAULT_SIMILARITY = 0.5;

mp.events.add('showCharacterCreator', (skinJson) => {
    if (skinJson) {
        utils.displayClientHud(false);
        utils.fadeScreen(() => {
            isEdit = true;
            showEditor();
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
    setCamera(index);
});

mp.events.add('changeModelAngle', (angle) => {
    currentPlayer.setHeading(angle);
});

mp.events.add('changeFeature', (index, value) => {
    currentPlayer.setFaceFeature(index, value);
});

mp.events.add('resetCharacter', () => {
    setCamera(1);

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
    characterUI.destroy();

    if(isEdit) {
        utils.fadeScreen(() => {
            mp.gui.cursor.show(false, false);
            mp.events.callRemote("saveCharacterInServer", json);

            hideEditor();
            utils.displayClientHud(true);
        }, 1000);
    }
    else {
        mp.events.callRemote("saveCharacterInServer", json);

        hideEditor();

        mp.game.graphics.transitionToBlurred(2000);

        utils.moveCamera(characterData.cameraCoords[camIndex].camera, characterData.cameraCoords[camIndex].fov,
            characterData.cameraCoords[camIndex].X, characterData.cameraCoords[camIndex].Y, characterData.cameraCoords[camIndex].Z,
            characterData.cameraMoveTo.camera, 40, characterData.cameraMoveTo.X, characterData.cameraMoveTo.Y,
            characterData.cameraMoveTo.Z , false, 7000);
    }
});

mp.events.add("changeParents", (mother, father, similarity) => {
    currentPlayer.setHeadBlendData(characterData.mothers[mother], characterData.fathers[father], 0,
        characterData.mothers[mother], characterData.fathers[father], 0, similarity, similarity, 0.0, false);
});


mp.events.add("changeGenderInClient", (number) => {
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

    camIndex = index;

    if(playerCamera) {
        playerCamera.setActive(false);
        playerCamera.destroy(true);
        playerCamera = false;
    }

    utils.moveCamera(characterData.cameraCoords[nullIndex].camera, characterData.cameraCoords[nullIndex].fov,
        characterData.cameraCoords[nullIndex].X, characterData.cameraCoords[nullIndex].Y, characterData.cameraCoords[nullIndex].Z,
        characterData.cameraCoords[index].camera, characterData.cameraCoords[index].fov,
        characterData.cameraCoords[index].X, characterData.cameraCoords[index].Y, characterData.cameraCoords[index].Z,
        false, 2000);
}

function hideEditor() {
    if(isEdit) {
        mp.gui.chat.activate(true);
        mp.gui.chat.show(true);
        mp.game.ui.displayRadar(true);
        mp.game.ui.displayHud(true);

        currentPlayer.freezePosition(false);

        mp.game.cam.destroyAllCams(true);

        mp.game.cam.renderScriptCams(false, false, 0, true, false);

        currentPlayer.position = currentPlayer.preCreatorPos;
        currentPlayer.setHeading(currentPlayer.preCreatorHeading);
        isEdit = false;
    }
    else {
        mp.events.call("gotoChoseWayInClient");
    }
}

function showEditor() {
    currentPlayer.preCreatorPos = currentPlayer.position;
    currentPlayer.preCreatorHeading = currentPlayer.getHeading();

    currentPlayer.position = characterData.creatorPlayerPos;
    currentPlayer.setHeading(characterData.creatorPlayerHeading);

    characterUI = mp.browsers.new("package://character/appearance/index.html");

    if(isEdit) {
        playerCamera = mp.cameras.new("creatorCamera", characterData.cameraCoords[1].camera, new mp.Vector3(0, 0, 0), characterData.cameraCoords[1].fov);
        playerCamera.pointAtCoord(characterData.cameraCoords[1].X, characterData.cameraCoords[1].Y, characterData.cameraCoords[1].Z);

        playerCamera.setActive(true);

        mp.gui.chat.activate(false);
        mp.gui.chat.show(false);
        mp.game.ui.displayRadar(false);
        mp.game.ui.displayHud(false);
        mp.players.local.clearTasksImmediately();
        mp.players.local.freezePosition(true);

        mp.game.cam.renderScriptCams(true, false, 0, true, false);

        mp.gui.cursor.show(true, true);
    }

    characterUI.active = true;

    currentPlayer.setHeadBlendData(characterData.mothers[0], characterData.fathers[0], 0, characterData.mothers[0], characterData.fathers[0], 0, DEFAULT_SIMILARITY, DEFAULT_SIMILARITY, 0.0, false);
}