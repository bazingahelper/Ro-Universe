let webUtils = require("./web_utilities");

async function fetchUserData (userId) {
    let [userInfo, userIcon] = await Promise.allSettled([
        webUtils.fetchFromURL(`https://users.roblox.com/v1/users/${userId}`),
        webUtils.fetchFromURL(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&includeBackground=true&includeProfileFrame=true&size=150x150&format=Png&isCircular=false`)
    ])

    userInfo = userInfo.value;
    userIcon = userIcon.value;
    
    let respObj;

    if (typeof userInfo === "object") {
        respObj = userInfo;
        // console.log(respObj)
        respObj.description = webUtils.htmlEncode(respObj.description).replace(/[\n]/, "\n");
    } else {
        return 404;
    }

   
    if (typeof userIcon === "object") {
        respObj.iconUrl = userIcon.data[0].imageUrl || webUtils.placeholderUserIcon;
    } else {
        respObj.iconUrl = webUtils.placeholderUserIcon;
    }

    return respObj;
}

async function fetchGroupInfo (groupId) {

    let [groupInfoV2, groupInfoV1, groupIcon] = await Promise.allSettled([
        webUtils.fetchFromURL(`https://groups.roblox.com/v2/groups?groupIds=${groupId}`),
        webUtils.fetchFromURL(`https://groups.roblox.com/v1/groups/${groupId}`),
        webUtils.fetchFromURL(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png&isCircular=false`)
    ])

    groupInfoV2 = groupInfoV2.value;
    groupInfoV1 = groupInfoV1.value;
    groupIcon = groupIcon.value;

    let respObj = {};

    if (typeof groupInfoV2 !== "object") return 404;
    respObj = groupInfoV2.data[0];
    respObj.description = webUtils.htmlEncode(respObj.description).replace(/[\n]/, "\n");


    if (typeof groupInfoV1 !== "object") {return 404;}
    respObj.owner = groupInfoV1.owner;
    respObj.isLocked = groupInfoV1.isLocked || false;
    respObj.hasVerifiedBadge = groupInfoV1.hasVerifiedBadge;
    respObj.memberCount = groupInfoV1.memberCount;


    if (typeof groupIcon !== "object") respObj.iconUrl = webUtils.placeholderGroupIcon;
    else respObj.iconUrl = groupIcon.data[0].imageUrl || webUtils.placeholderGroupIcon;

    return respObj;
}



module.exports = {fetchUserData, fetchGroupInfo}