function integerPrettier(numberOrString) {
    const postFix = ["B", "T", "Q", "Qd", "Qn", "Sx", "Sp"];
    if (parseInt(numberOrString) !== parseInt(numberOrString)) {
        return numberOrString;
    }

    numberOrString = parseInt(numberOrString)


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
}

function formatDate(dateStr) {
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
        console.log(timeDifference.getDate() - 1)
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

module.exports = {integerPrettier, formatDate}

// console.log(integerPrettier("9999"))
// console.log(formatDate("2025-12-07T19:08:39.077Z"))