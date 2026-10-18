let clickOnSwitchElements = document.querySelectorAll(".base_switch_onclick")

function toggleText(element) {
    let currentDialogNo = parseInt(element.getAttribute("data-current-sequence"));
    let dialogGrp = element.getAttribute("data-linked-switch-grp");

    if (!parseInt(currentDialogNo) || !element.getAttribute(`data-toggle-text-${currentDialogNo + 1}`)) {
        element.setAttribute("data-current-sequence", "1");
        currentDialogNo = 0;
    }

    currentDialogNo++;
    let dialog = element.getAttribute(`data-toggle-text-${parseInt(currentDialogNo)}`)
    element.setAttribute("data-current-sequence", currentDialogNo.toString());
    element.textContent = dialog

    if (dialogGrp) {
        let linkedGrps = document.querySelectorAll(`[data-linked-switch-grp="${dialogGrp}"]`);
        linkedGrps.forEach((linkedElement) => {
            linkedElement.setAttribute("data-current-sequence", currentDialogNo.toString());
            linkedElement.textContent = linkedElement.getAttribute(`data-toggle-text-${currentDialogNo}`)
        })
    }

}

clickOnSwitchElements.forEach((element) => {
    element.addEventListener("click", function() {
        toggleText(element);
    })
    element.textContent = element.getAttribute(`data-toggle-text-1`);
})