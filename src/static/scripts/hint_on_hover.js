let hoverableElements = document.querySelectorAll(".hint_on_hover");
let documentClickEvent;

// <div class="hover_box">
//     <p>Test</p>
// </div>

let isHover = false;

let hoverBox = document.createElement("div");
hoverBox.classList.add("hover_box");
document.body.appendChild(hoverBox);

let hoverBoxText = document.createElement("p");
hoverBox.appendChild(hoverBoxText);

hoverBox.style.opacity = 0

let hoverableElementInQn;

// https://forum.freecodecamp.org/t/how-to-make-js-wait-until-dom-is-updated/122067/3
function waitForDOMUpdate(fn) {
    let intermediate = function () {window.requestAnimationFrame(fn)}
    window.requestAnimationFrame(intermediate)
}

function clamp (number, min, max) {
    return Math.max(min, Math.min(max, number))
}

function showBox() {
    let openDialog = document.querySelector("dialog:modal")
    const rectSize = hoverableElementInQn.getBoundingClientRect();
    const middleOfElementX = rectSize.left + ((rectSize.right - rectSize.left) / 2);

    if (openDialog) {
        const dialogBounds = openDialog.getBoundingClientRect();
        openDialog.appendChild(hoverBox)
        hoverBox.style.top = `${rectSize.top - hoverBox.clientHeight - dialogBounds.top}px`;
        hoverBox.style.left = `${clamp(
            middleOfElementX - (hoverBox.clientWidth / 2) - dialogBounds.left, 
            0, 
            window.innerWidth - hoverBox.clientWidth - (window.innerWidth - dialogBounds.right)
        )}px`
    } else {
        document.body.appendChild(hoverBox);
        const windowSY = window.scrollY;
        const windowSX = window.scrollX;

        hoverBox.style.top = `${windowSY + rectSize.top - hoverBox.clientHeight}px`;
        // hoverBox.style.left = `${clamp(
        //     windowSX + middleOfElementX - (hoverBox.clientWidth / 2), 
        //     0, 
        //     Math.max(window.innerWidth - hoverBox.clientWidth, 0)
        // )}px`;
        hoverBox.style.left = `${clamp(
            windowSX + middleOfElementX - (hoverBox.clientWidth / 2), 
            0, 
            window.innerWidth - hoverBox.clientWidth
        )}px`
    } 

    


    hoverBox.style.opacity = 1

}

function hideBox() {
    isHover = false;
    hoverBox.style.opacity = 0
}

hoverableElements.forEach((element) => {
    element.addEventListener("mouseenter", function(event) {
        isHover = true;
        setTimeout(() => {
            if (!isHover) return;
            hoverBoxText.textContent = element.getAttribute("data-hint-on-hover")
            hoverableElementInQn = element
            
            waitForDOMUpdate(showBox) 
        }, 150);
    });
    element.addEventListener("click", function(event) {
        if (documentClickEvent) {
            document.removeEventListener("click", documentClickEvent)
            documentClickEvent = null;
        }

        hoverBoxText.textContent = element.getAttribute("data-hint-on-hover")
        hoverableElementInQn = element
        waitForDOMUpdate(showBox)

        document.addEventListener("click", hideBox);
        documentClickEvent = hideBox
    })

    element.addEventListener("mouseleave", hideBox)
})

window.addEventListener("resize", hideBox)