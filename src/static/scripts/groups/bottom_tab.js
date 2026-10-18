// implement workaround

let tabHeader = document.querySelector('fieldset.toggleable_tab_headers');
let tabHeaderContent = document.querySelector('section.toggleable_tab_content');
let groupId = parseInt(document.querySelector('meta[name="group_id"]').getAttribute('data-user-id'));
let errorFrame = tabHeaderContent.querySelector('article.base_error');
let loadingFrame = tabHeaderContent.querySelector('article.base_loading');
let tabStatus = {
    "group_places": "loading",
    "group_members": "loading",
    "group_affiliates": "loading"
}

let placesList = [];
let membersList = { currentlySelected: "", rankDetails: {}
// [id] = {page: 0, list: [], cursor: undefined, memberCount: role.memberCount, id: role.id, name: (role.isBase && "All Members") || role.name}
};

let affialiatesList = {
    "Allies": {page: -1, list: [], cursor: 0, totalCount: undefined},
    "Enemies": {page: -1, list: [], cursor: 0, totalCount: undefined}
};
const affialitePageSize = 10;
const memberPageSize = 10;

import { integerAbbreviator, sortIntoMainPage } from "../modules/prettier.js";
import { fetchByProxy, placeholderGameIcon, placeholderGroupIcon, placeholderUserIcon, redundantUni } from "../modules/net_utils.js";

// HELPERS
// =========================================================================================


// GAME CONTROLLER
// =========================================================================================

let areGamesLoaded = false;
let zeroGames = false;
async function loadGames () {
    if (zeroGames) {
        loadingFrame.style.display = 'none';
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No games found."
    }

    if (areGamesLoaded) return;
    areGamesLoaded = true;

    let cursor = ""
    let searchingForGame = true;
    while (searchingForGame) {
        let listOfPlaceIds = "";
        let listOfUniIds = "";
        let loggedUnis = {};
        let result = await fetchByProxy(`https://games.roblox.com/v2/groups/${groupId}/gamesV2?limit=50&sortOrder=Desc&cursor=${cursor || ""}`, errorFrame, false, "Could not fetch games (Roblox's API might be down).");

        if (typeof result !== "object") {
            loadingFrame.style.display = '';
            areGamesLoaded = false;
            break;
        }

        result.data.forEach((universe, index) => {
            loggedUnis[universe.id] = {
                universeId: universe.id,
                name: universe.name,
                placeId: universe.rootPlace.id,
                sortOrder: index + 1
            }

            listOfPlaceIds += universe.rootPlace.id + ",";
            listOfUniIds += universe.id + ",";
        })

        cursor = result.nextPageCursor;
        if (!cursor || cursor.length == 0) searchingForGame = false;
        if (result.data.length == 0) break;

        listOfPlaceIds = listOfPlaceIds.substring(0, listOfPlaceIds.length - 1);
        listOfUniIds = listOfUniIds.substring(0, listOfUniIds.length - 1);

        result = await fetchByProxy(`https://games.roblox.com/v1/games/votes?universeIds=${listOfUniIds}`, errorFrame, true);
        if (typeof result === "object") {
            result.data.forEach((ratings) => {
                loggedUnis[ratings.id].upVotes = ratings.upVotes;
                loggedUnis[ratings.id].downVotes = ratings.downVotes;
            })
        }

        if (listOfUniIds.split(",").length === 1) {listOfUniIds += "," + redundantUni}

        result = await fetchByProxy(`https://games.roblox.com/v1/games?universeIds=${listOfUniIds}`, errorFrame, true);
        if (typeof result === "object") {
            // console.log(result)
            result.data.forEach((gameData) => {
                if (gameData.id === 0) return;
                if (gameData.id == redundantUni) return;
                loggedUnis[gameData.id].playing = gameData.playing;
            })
        }

        let loggedPlaces = {};
        Object.values(loggedUnis).forEach((uni) => {
            loggedPlaces[uni.placeId] = uni;
        })

        result = await fetchByProxy(`https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${listOfPlaceIds}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`, errorFrame, true);
        
        if (typeof result === "object") {
            result.data.forEach((iconData) => {
                loggedPlaces[iconData.targetId].iconUrl = iconData.imageUrl;
            })
        }

        // Object.values(loggedPlaces).forEach((place) => {
        //     loggedUnis[place.universeId] = place;
        // })

        let finalPlaces = Object.values(loggedPlaces).sort((a, b) => {
            if (a.sortOrder < b.sortOrder) return -1;
            else return 1;
        });
        finalPlaces.forEach((place) => {
            placesList.push(place);
        })

    }

    loadingFrame.style.display = 'none';

    if (placesList.length == 0) {
        zeroGames = true;
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No games found."
        return;
    }

    let placeFrame = tabHeaderContent.querySelector('ul.game_place_list');
    let placeTemplate = placeFrame.querySelector('li.template');

    placesList.forEach((place) => {
        let newPlace = placeTemplate.cloneNode(true);
        newPlace.classList.remove("template");

        newPlace.querySelector('a > div > img').src = place.iconUrl || placeholderGameIcon;
        newPlace.querySelector('a').href = `/games/${place.placeId}`;

        newPlace.querySelector('div > p.grid_item_title').textContent = place.name;

        if (place.upVotes === undefined || place.downVotes === undefined) {
            newPlace.querySelector('ul > li.game_like_dislike_ratio span').textContent = "Unknown"
        } else if (place.upVotes === place.downVotes && place.downVotes === 0) {
            newPlace.querySelector('ul > li.game_like_dislike_ratio span').textContent = "--%"
        } else {
            newPlace.querySelector('ul > li.game_like_dislike_ratio span').textContent = `${Math.floor(place.upVotes / (place.upVotes + place.downVotes) * 100)}%`
        }

        if (place.playing === undefined) {
            newPlace.querySelector('ul > li.game_playing_now span').textContent = `?`;
        } else {
            newPlace.querySelector('ul > li.game_playing_now span').textContent = integerAbbreviator(place.playing, true);
        }

        placeFrame.appendChild(newPlace);
    })
}

// AFFILIATES CONTROLLER
// =========================================================================================

let affialiateContainer = tabHeaderContent.querySelector('article.group_affiliates');
let affialiateFilter = affialiateContainer.querySelector('span.sort_section select');
let buttonAffialiateLoadMore = affialiateContainer.querySelector(':scope > button.button_loadmore');

async function toggleAffialiateFrame() {
    let affialiateValue = affialiateFilter.value;
    let allyContainer = affialiateContainer.querySelector('article.group_allies');
    let enemyContainer = affialiateContainer.querySelector('article.group_enemies');

    if (affialiateValue === "Allies") {
        allyContainer.style.display = '';
        enemyContainer.style.display = 'none';
    } else {
        allyContainer.style.display = 'none';
        enemyContainer.style.display = '';
    }

    if (affialiatesList[affialiateValue].totalCount === undefined) await loadAffialiateInfo();

    let totalCount = affialiatesList[affialiateValue].totalCount

    // Next page doesn't exist = hide "load more" button
    if (!totalCount || totalCount <= (affialiatesList[affialiateValue].page + 1) * affialitePageSize) {
        buttonAffialiateLoadMore.style.display = 'none';
        errorFrame.style.display = ''
        errorFrame.querySelector('p').textContent = "No affialiates left."
    } else {
        buttonAffialiateLoadMore.style.display = '';
        errorFrame.style.display = 'none';
    }

}

affialiateFilter.addEventListener("change", toggleAffialiateFrame)

async function loadAffialiateInfo () {
    let affialiateValue = affialiateFilter.value;
    let container

    if (affialiateValue === "Allies") {
        container = affialiateContainer.querySelector('article.group_allies');
    } else {
        container = affialiateContainer.querySelector('article.group_enemies');
    }

    loadingFrame.style.display = '';
    tabStatus.group_affiliates = "loading";
    errorFrame.style.display = 'none';
    buttonAffialiateLoadMore.style.display = 'none';

    // Get affialiate info + group icons of affialiate
    if (affialiatesList[affialiateValue].totalCount === undefined || (affialiatesList[affialiateValue].page + 1) % 5 === 0) {
        let result = await fetchByProxy(`https://groups.roblox.com/v1/groups/${groupId}/relationships/${affialiateValue}?StartRowIndex=${affialiatesList[affialiateValue].cursor}&MaxRows=50`, errorFrame, false, "Could not fetch affialiate info.");
        let groupInfo = {}
        let listOfGroupIds = "";
        if (typeof result !== "object") {
            loadingFrame.style.display = 'none';
            tabStatus.group_affiliates = "done";
            return;
        }

        if (affialiatesList[affialiateValue].totalCount === undefined) {
            affialiatesList[affialiateValue].totalCount = result.totalGroupCount;
            let beautifiedNumber = integerAbbreviator(result.totalGroupCount, false);
            container.querySelector(':scope > h2 span').textContent = `(${beautifiedNumber.prettyInt || beautifiedNumber})`;
        }

        affialiatesList[affialiateValue].cursor += 50;
        if (result.relatedGroups.length == 0) {
            loadingFrame.style.display = 'none';
            tabStatus.group_affiliates = "done";
            buttonAffialiateLoadMore.style.display = 'none';
            errorFrame.style.display = '';
            errorFrame.querySelector('p').textContent = "No affialiates left."
            return;
        }

        result.relatedGroups.forEach((group, index) => {
            group.sortOrder = index;
            groupInfo[group.id] = group;
            listOfGroupIds += group.id + ","
        })

        listOfGroupIds = listOfGroupIds.substring(0, listOfGroupIds.length - 1);
        result = await fetchByProxy(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${listOfGroupIds}&size=420x420&format=Png&isCircular=false`, errorFrame, false, "Could not fetch icons for some groups.")

        if (typeof result === "object") {
            result.data.forEach((icon) => {
                groupInfo[icon.targetId].iconUrl = icon.imageUrl;
            })
        }

        let finalList = Object.values(groupInfo);
        finalList.sort((a, b) => {
            if (a.sortOrder < b.sortOrder) return -1;
            else return 1;
        });
        affialiatesList[affialiateValue].list = sortIntoMainPage(affialiatesList[affialiateValue].list, finalList, affialitePageSize);
    }

    

    affialiatesList[affialiateValue].page++;
    let affialiteCurrentList = affialiatesList[affialiateValue].list[affialiatesList[affialiateValue].page]
    
    // console.log(affialiteCurrentList);
    // console.log(affialiatesList[affialiateValue])

    if (!affialiteCurrentList || affialiteCurrentList.length == 0) {
        loadingFrame.style.display = 'none';
        tabStatus.group_affiliates = "done";
        buttonAffialiateLoadMore.style.display = 'none';
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No affialiates left."
        return;
    }

    

    loadingFrame.style.display = 'none';
    tabStatus.group_affiliates = "done";
    buttonAffialiateLoadMore.style.display = '';
    errorFrame.style.display = 'none';

    let list = container.querySelector(':scope > ul');
    let template = list.querySelector('li.template');

    affialiteCurrentList.forEach((affialiate) => {
        let newGroup = template.cloneNode(true);
        newGroup.classList.remove("template");

        newGroup.querySelector('a').href = `/groups/${affialiate.id}`;

        newGroup.querySelector('a > div > img').src = affialiate.iconUrl || placeholderGroupIcon;
        newGroup.querySelector('.grid_item_title').textContent = affialiate.name;

        let prettyGrpMemberNumber = integerAbbreviator(affialiate.memberCount || "Unknown", true);
        newGroup.querySelector('.group_members').textContent = prettyGrpMemberNumber + " members";
        if (newGroup.hasVerifiedBadge) {
            newGroup.querySelector('span.flex_hori_center > img').style.display = '';
        } else {
            newGroup.querySelector('span.flex_hori_center > img').style.display = 'none';
        }

        list.appendChild(newGroup);
    })

    let affialiateNextList = affialiatesList[affialiateValue].list[affialiatesList[affialiateValue].page + 1]

    if (!affialiateNextList || affialiateNextList.length == 0) {
        loadingFrame.style.display = 'none';
        tabStatus.group_affiliates = "done";
        buttonAffialiateLoadMore.style.display = 'none';
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No affialiates left."
        return;
    }
    
    
}

buttonAffialiateLoadMore.addEventListener("click", loadAffialiateInfo);

// MEMBER LIST CONTROLLER
// =========================================================================================

let groupMemberFrame = tabHeaderContent.querySelector(':scope > article.group_members')
let dialog = groupMemberFrame.querySelector(':scope > dialog');

// Ensures member tab functionality, otherwise restricts it and prevents further user input.
async function initRoleFrame () {
    let results = await fetchByProxy(`https://groups.roblox.com/v1/groups/${groupId}/roles?includePrivate=true`, errorFrame, true)
    if (typeof results !== "object") {
        if (tabHeader.querySelector('input[value="group_members"]').checked) {
            errorFrame.style.display = '';
            errorFrame.querySelector('p').textContent = "Could not load rank info. Roblox's API might be down, or the group restricts who views their member list."
        }
        tabStatus.group_members = "failed";

        let content = groupMemberFrame.querySelectorAll(':scope > article, :scope > button');
        content.forEach((element) => {element.style.display = 'none'});

        let dialog = groupMemberFrame.querySelector(':scope > dialog');
        dialog.close();
        return;
    }

    let rolesetToTest = results.roles[results.roles.length - 1].id; // uses last role as test
    let dialogList = groupMemberFrame.querySelector(':scope > dialog#group_rank_dialog div.dialog_content > ul');
    let buttonTemplate = dialogList.querySelector(':scope > li.template');
    let contentTemplate = groupMemberFrame.querySelector('article.template');
    

    let hasFirstRoleBeenFound = false

    
    let testResults = await fetchByProxy(`https://groups.roblox.com/v1/groups/${groupId}/roles/${rolesetToTest}/users?limit=10&sortOrder=Asc`, errorFrame, true)

    if (typeof testResults !== "object") {
        if (tabHeader.querySelector('input[value="group_members"]').checked) {
            errorFrame.style.display = '';
            errorFrame.querySelector('p').textContent = "Could not load rank info. Roblox's API might be down, or the group restricts who views their member list."
        }
        tabStatus.group_members = "failed";

        let content = groupMemberFrame.querySelectorAll(':scope > article, :scope > button');
        content.forEach((element) => {element.style.display = 'none'});

        
        dialog.close();
        return;
    }

    // console.log(results)

    results.roles.forEach((role, index) => {
        if (role.rank === 0) return;
        // if (role.isBase) return;
        membersList.rankDetails[role.id] = {page: 0, list: [], cursor: undefined, memberCount: role.memberCount, id: role.id, name: (role.isBase && "All Members") || role.name};
        if (index === results.roles.length - 1) {
            rolesetToTest = role.id;
        }

        let newRole = buttonTemplate.cloneNode(true);
        newRole.classList.remove("template");

        newRole.querySelector('button').setAttribute('data-rank-id', role.id);
        newRole.querySelector('.rank_name').textContent = (role.isBase && "All Members ") || role.name;

        let prettyNumbers = integerAbbreviator(role.memberCount, true)
        newRole.querySelector('.rank_count').textContent = prettyNumbers;
        dialogList.appendChild(newRole);
        newRole.querySelector(":scope > button").addEventListener("click", toggleRoleView);
        
        prettyNumbers = integerAbbreviator(role.memberCount);
        let newRoleFrame = contentTemplate.cloneNode(true);
        newRoleFrame.classList.remove('template');

        newRoleFrame.setAttribute("data-rank-id", role.id);
        newRoleFrame.querySelector(':scope > h2 span:nth-child(2)').textContent = `(${prettyNumbers.prettyInt || prettyNumbers})`
        newRoleFrame.querySelector(':scope > h2 span:nth-child(1)').textContent = (role.isBase && "All Members ") || role.name + " ";
        
        newRoleFrame.setAttribute("data-rank-id", role.id)
        groupMemberFrame.appendChild(newRoleFrame);
        

        let loadMoreBtn = newRoleFrame.querySelector('button.button_loadmore');
        loadMoreBtn.addEventListener("click", fetchRoleMembers)

        if (hasFirstRoleBeenFound) {
            newRoleFrame.style.display = 'none';
        } else {
            // let newClickEvent = new Event("click");
            // loadMoreBtn.dispatchEvent(newClickEvent);
            membersList.currentlySelected = role.id.toString()
        }

        hasFirstRoleBeenFound = true;
    })
}

function toggleRoleView(event) {
    errorFrame.style.display = 'none';
    loadingFrame.style.display = 'none';

    let requestedRank = event.currentTarget.getAttribute("data-rank-id");
    let allFrames = groupMemberFrame.querySelectorAll(':scope > article');
    let dialog = groupMemberFrame.querySelector(':scope > dialog');
    allFrames.forEach((frame) => frame.style.display = 'none');

    let requestedFrame = groupMemberFrame.querySelector(`:scope > article[data-rank-id="${requestedRank}"]`);
    requestedFrame.style.display = '';

    let requestedTabInfo = membersList.rankDetails[requestedRank];
    if (requestedTabInfo.cursor === undefined) {
        let loadMoreBtn = requestedFrame.querySelector(':scope > button.button_loadmore')
        let newClickEvent = new Event("click");
        loadMoreBtn.dispatchEvent(newClickEvent);
    };

    membersList.currentlySelected = requestedRank

    dialog.close();
}

async function fetchRoleMembers (event) {
    let requestedRoleId = event.currentTarget.parentElement.getAttribute("data-rank-id");
    let requestedMemberFrame = groupMemberFrame.querySelector(`:scope > article[data-rank-id="${requestedRoleId}"]`);
    let showMoreBtn = requestedMemberFrame.querySelector(':scope > button.button_loadmore');
    let listFrame = requestedMemberFrame.querySelector(':scope > ul.group_members_list');

    // At last page
    if ((membersList.rankDetails[requestedRoleId].cursor !== undefined) && membersList.rankDetails[requestedRoleId].memberCount <= membersList.rankDetails[requestedRoleId].page + 1 * memberPageSize) {
        showMoreBtn.style.display = 'none';
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No more members to display.";
        return;
    }

    // No more content to load
    if (membersList.rankDetails[requestedRoleId].memberCount === 0) {
        showMoreBtn.style.display = 'none';
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No more members to display.";
        return;
    }

    loadingFrame.style.display = '';
    errorFrame.style.display = 'none';
    tabStatus.group_members = "loading";

    if (membersList.rankDetails[requestedRoleId].cursor === undefined || (membersList.rankDetails[requestedRoleId].page + 1) % 5 === 0) {
        let result = await fetchByProxy(`https://groups.roblox.com/v1/groups/${groupId}/roles/${requestedRoleId}/users?limit=50&sortOrder=Desc&cursor=${membersList.rankDetails[requestedRoleId].cursor || ""}`, errorFrame, false, "Could not retrieve information on members.");
        let userIdStr = "";
        let loggedUsers = {};

        if (typeof result !== "object") {
            tabStatus.group_members = "done";
            loadingFrame.style.display = 'none';
            return;
        }

        membersList.rankDetails[requestedRoleId].cursor = result.nextPageCursor;
        if (result.data.length == 0) {
            tabStatus.group_members = "done";
            loadingFrame.style.display = 'none';
            showMoreBtn.style.display = 'none';
            errorFrame.style.display = '';
            errorFrame.querySelector('p').textContent = "No more members to display.";
            return;
        }

        result.data.forEach((plr, index) => {
            userIdStr += plr.userId + ",";
            plr.sortOrder = index + 1;
            loggedUsers[plr.userId] = plr;
        })

        userIdStr = userIdStr.substring(0, userIdStr.length - 1);
        result = await fetchByProxy(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userIdStr}&includeBackground=true&includeProfileFrame=true&size=180x180&format=Png&isCircular=false`);

        if (typeof result === "object") {
            result.data.forEach((icon) => {
                loggedUsers[icon.targetId].iconUrl = icon.imageUrl;
            })
        }

        let finalUserIds = Object.values(loggedUsers);
        finalUserIds.sort((a, b) => {
            if (a.sortOrder < b.sortOrder) return -1;
            else return 1
        });
        console.log(finalUserIds);

        membersList.rankDetails[requestedRoleId].list = sortIntoMainPage(membersList.rankDetails[requestedRoleId].list, finalUserIds, memberPageSize);

    }

    console.log(membersList)

    let currentPage = membersList.rankDetails[requestedRoleId].list[membersList.rankDetails[requestedRoleId].page];
    if (!currentPage || currentPage.length === 0) {
        tabStatus.group_members = "done";
        loadingFrame.style.display = 'none';
        showMoreBtn.style.display = 'none';
        errorFrame.style.display = '';
        errorFrame.querySelector('p').textContent = "No more members to display.";
        return;
    }

    let listTemplate = listFrame.querySelector('li.template');

    currentPage.forEach((member) => {
        let newMember = listTemplate.cloneNode(true);
        newMember.classList.remove("template");

        newMember.querySelector(":scope > a").href = `/users/${member.userId}`;
        newMember.querySelector(".grid_item_title span").textContent = member.displayName;

        if (member.hasVerifiedBadge) {
            newMember.querySelector(".grid_item_title img").style.display = '';
        } else {
            newMember.querySelector(".grid_item_title img").style.display = 'none';
        }

        newMember.querySelector('.grid_item_description').textContent = `@${member.username}`;
        newMember.querySelector(':scope > a > img').src = member.iconUrl || placeholderUserIcon
        listFrame.appendChild(newMember);
    })

    membersList.rankDetails[requestedRoleId].page++
    currentPage = membersList.rankDetails[requestedRoleId].list[membersList.rankDetails[requestedRoleId].page];

    loadingFrame.style.display = 'none';
    tabStatus.group_members = "done";

    if (!currentPage || currentPage.length == 0 || membersList.rankDetails[requestedRoleId].memberCount <= membersList.rankDetails[requestedRoleId].page + 1 * memberPageSize) {
        showMoreBtn.style.display = 'none';
        errorFrame.style.display = '';
        // loadingFrame.style.display = 'none';
        errorFrame.querySelector('p').textContent = "No more members to display.";
        return;
    }
    

}

// OOB = out of bounds

function checkIfUserOOB (event) {
    let dialogSize = dialog.getBoundingClientRect();
    let mouseScreenX = event.screenX;
    let mouseScreenY = event.screenY;

    if (event.target !== dialog) return;

    if (mouseScreenX < dialogSize.left || mouseScreenX > dialogSize.right || mouseScreenY < dialogSize.top || mouseScreenY > dialogSize.right) {
        dialog.close();
    }
}

dialog.addEventListener("click", checkIfUserOOB)

// TAB CONTROLLER
// =========================================================================================

function hideAllContentFrame() {
    let allContent = tabHeaderContent.querySelectorAll(":scope > *");
    allContent.forEach((frame) => {
        frame.style.display = 'none';
    })
}

function toggleContentFrame(event) {
    let selectedInput = event.currentTarget;
    let selectedValue = selectedInput.value;
    hideAllContentFrame();

    if (tabStatus[selectedValue] === "loading") loadingFrame.style.display = '';
    tabHeaderContent.querySelector(`:scope > .${selectedValue}`).style.display = '';
    if (selectedValue === "group_places") loadGames();
    else if (selectedValue === "group_affiliates") toggleAffialiateFrame();
    else if (selectedValue === "group_members") {
        if (membersList.currentlySelected) {
            let selectedBtn = groupMemberFrame.querySelector(`:scope > dialog button[data-rank-id="${membersList.currentlySelected}"]`)
            selectedBtn.dispatchEvent(new Event("click"))
        }
        if (tabStatus[selectedValue] === "failed") {
            errorFrame.style.display = '';
            errorFrame.querySelector('p').textContent = "Could not load rank info. Roblox's API might be down, or the group restricts who views their member list."
        }
    }
}

// TABS

let tabButtons = tabHeader.querySelectorAll("input");

hideAllContentFrame()
await initRoleFrame()

tabButtons.forEach((button) => {
    button.addEventListener("change", toggleContentFrame)
    if (button.checked) {
        let changeEvent = new Event("change");
        button.dispatchEvent(changeEvent);
    }
})


