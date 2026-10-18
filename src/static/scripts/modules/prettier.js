export function integerAbbreviator(numberOrString, shortenStrictlyWithPostfix) {
    const strictpostFix = ["K", "M", "B", "T", "Q", "Qd", "Qn", "Sx", "Sp"];
    const postFix = ["B", "T", "Q", "Qd", "Qn", "Sx", "Sp"];
    if (parseInt(numberOrString) !== parseInt(numberOrString)) {
        return numberOrString;
    }

    let finalNumber;
    numberOrString = parseInt(numberOrString)

    if (!shortenStrictlyWithPostfix) {
        let numberArray = numberOrString.toString().split("").reverse();
        let finalPrettyInt = "";
        for (let i = 0; i < numberArray.length; i++) {
            finalPrettyInt += numberArray[i];
            if ((i + 1) % 3 == 0 && i !== numberArray.length - 1) finalPrettyInt += ","
        }

        finalPrettyInt = finalPrettyInt.split("").reverse().join("");

        if (numberOrString < 10 ** 9) return finalPrettyInt;
        let finalNumberObj = {
            prettyInt: finalPrettyInt,
            shortenedInt: ""
        }

        for (let i = 0; i < postFix.length; i++) {
            let magnitude = 10 ** (3 * i + 9)

            if (i + 1 == postFix.length || Math.floor(numberOrString / magnitude) <= 999) {
                let num = (numberOrString / magnitude).toFixed(2) + postFix[i];
                finalNumberObj.shortenedInt = num;
                break;
            }
        }

        return finalNumberObj;
    } else {

        if (numberOrString < 10 ** 3) return numberOrString;

        for (let i = 0; i < strictpostFix.length; i++) {
            let magnitude = 10 ** (3 * i + 3)

            if (i + 1 == strictpostFix.length || Math.floor(numberOrString / magnitude) <= 999) {
                let num = (numberOrString / magnitude).toFixed(2).split("").reverse()
                

                for (let k = 0; k < num.length; k++) {
                    if (num[k] === "0") {
                        num.splice(k, 1);
                        k--
                    } else if (num[k] === ".") {
                        if (k === 0) num.splice(k, 1);
                        break;
                    } else {
                        break;
                    }
                }

                finalNumber = num.reverse().join("") + strictpostFix[i];
                break;
            }
        }
        return finalNumber;
    }
    
}

// Given an array of arrays (mainPages), an array (entriesToSort) and an integer (pageSize),
// sort entriesToSort to the appropriate array in mainPages, creating new arrays in mainPages if necessary
// Function will not modify/check any pages before the last page in mainPages
export function sortIntoMainPage(mainPages, entriesToSort, pageSize) {
    let lastPage = mainPages[mainPages.length - 1];
    let entryToOffset = 0;

    if (entriesToSort.length == 0) return mainPages;

    if (lastPage && lastPage.length < pageSize) {
        for (let i = 0; i < Math.min(pageSize - lastPage.length, entriesToSort.length); i++) {
            entryToOffset++;
            lastPage.push(entriesToSort[i]);
        }
    }


    let draftPagesToPush = [];

    for (let i = 0; i < entriesToSort.length - entryToOffset; i++) {
        let entry = entriesToSort[i + entryToOffset];
        let page = draftPagesToPush[Math.floor(i / pageSize)];

        if (!page) {
            draftPagesToPush[Math.floor(i / pageSize)] = [];
            page = draftPagesToPush[Math.floor(i / pageSize)]
        }

        page.push(entry);
    }

    for (let i = 0; i < draftPagesToPush.length; i++) {
        mainPages.push(draftPagesToPush[i]);
    }

    return mainPages;
}

export function formatDate(dateStr) {
    let epochTime = Date.parse(dateStr);
    if (epochTime !== epochTime) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]

    let allFormattedDates = []
    let dateObj = new Date(epochTime)
    let timeDifference = new Date(Date.now() - dateObj)

    // Relative
    if (timeDifference.getFullYear() - 1970 > 0) {
        allFormattedDates.push(`${timeDifference.getFullYear() - 1970} ${(timeDifference.getFullYear() - 1970 <= 1 && "year") || "years"} ago`);
    } else if (timeDifference.getMonth() > 0) {
        allFormattedDates.push(`${timeDifference.getMonth()} ${(timeDifference.getMonth() <= 1 && "month") || "months"} ago`);
    } else if (Math.floor(timeDifference.getDate() / 7) > 1) {
        allFormattedDates.push(`${Math.floor(timeDifference.getDate() / 7)} ${(Math.floor(timeDifference.getDate() / 7) <= 1 && "week") || "weeks"} ago`);
    } else if (timeDifference.getDate() - 1 > 0) {
        allFormattedDates.push(`${timeDifference.getDate() - 1} ${(timeDifference.getDate() - 1 <= 1 && "day") || "days"} ago`);
    } else if (timeDifference.getHours() > 0) {
        allFormattedDates.push(`${timeDifference.getHours()} ${(timeDifference.getHours() <= 1 && "hour") || "hours"} ago`);
    } else if (timeDifference.getMinutes() > 0) {
        allFormattedDates.push(`${timeDifference.getMinutes()} ${(timeDifference.getMinutes() <= 1 && "minte") || "minutes"} ago`);
    } else {
        allFormattedDates.push("Less than a minute ago");
    }
    // DD-MM-YYYY
    allFormattedDates.push(dateObj.toLocaleDateString())
    // Local time
    allFormattedDates.push(dateObj.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "long"
    }))

    return allFormattedDates;
}