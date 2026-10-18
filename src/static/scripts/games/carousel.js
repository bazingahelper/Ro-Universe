let carouselList = document.querySelectorAll(".game_carousel")
let pointerState = {}


// ADD:
// MutationObserver (set opacity)
// Use Promise to switch images every 10s

function updateImgAltBtn (carousel, img) {
    let altBtn = carousel.querySelector(".game_alt_text");
    if (!altBtn) return;

    if (pointerState[carousel] === false) {
        altBtn.style.pointerEvents = 'none';
        altBtn.style.opacity = 0;
        return
    }

    if (img.getAttribute("alt") && img.getAttribute("alt").length > 0) {
        altBtn.style.pointerEvents = '';
        altBtn.style.opacity = 1;
        altBtn.setAttribute("data-hint-on-hover", img.getAttribute("alt"));
    } else {
        altBtn.style.pointerEvents = 'none';
        altBtn.style.opacity = 0;
    }
}

function updateCreatorStoreLink (carousel, img) {
    let creatorStoreBtn = carousel.querySelector(".game_creator_store");
    if (!creatorStoreBtn) return;

    if (pointerState[carousel] === false) {
        creatorStoreBtn.style.pointerEvents = 'none';
        creatorStoreBtn.style.opacity = 0;
        return
    }

    if (img.getAttribute("data-image-id") && img.getAttribute("data-image-id").length > 0) {
        creatorStoreBtn.style.pointerEvents = '';
        creatorStoreBtn.style.opacity = 1;
        creatorStoreBtn.setAttribute("href", `https://roblox.com/library/${img.getAttribute("data-image-id")}`);
    } else {
        creatorStoreBtn.style.pointerEvents = 'none';
        creatorStoreBtn.style.opacity = 0;
    }
}

function fadeOutAllBtns (carousel) {
    let creatorStoreBtn = carousel.querySelector(":scope > .game_creator_store");
    let altTextBtn = carousel.querySelector(":scope > .game_alt_text");
    let thumbnailBtns = carousel.querySelectorAll(":scope > .game_thumbnail_btns");

    creatorStoreBtn.style.opacity = 0;
    altTextBtn.style.opacity = 0;
    thumbnailBtns.forEach((btn) => {btn.style.opacity = 0; btn.style.pointerEvents = 'none'})
}

function applyOpacityToThumbnailBtns (carousel) {
    let listOfImages = carousel.querySelectorAll(":scope > img");
    let thumbnailBtns = carousel.querySelectorAll(":scope > .game_thumbnail_btns");

    if (listOfImages.length > 1) {
        thumbnailBtns.forEach((btn) => {
            btn.style.opacity = 1,
            btn.style.pointerEvents = '';
        })
    } else {
        thumbnailBtns.forEach((btn) => {
            btn.style.opacity = 0
            btn.style.pointerEvents = 'none';
        })
    }
}

function previousImg (carousel) {
    let currentImageSequence = parseInt(carousel.getAttribute("data-current-img"));
    let listOfImages = carousel.querySelectorAll(":scope > img");
    let currentImage = listOfImages[currentImageSequence];

    if (!(currentImageSequence == currentImageSequence) || !listOfImages[currentImageSequence - 1]) {
        currentImageSequence = listOfImages.length;
    }

    currentImageSequence--;
    currentImage.style.opacity = 0;
    currentImage.style.pointerEvents = 'none';
    listOfImages[currentImageSequence].style.opacity = 1;
    listOfImages[currentImageSequence].style.pointerEvents = '';

    updateImgAltBtn(carousel, listOfImages[currentImageSequence]);
    updateCreatorStoreLink(carousel, listOfImages[currentImageSequence]);

    carousel.setAttribute("data-current-img", currentImageSequence)
}

function nextImg (carousel) {
    let currentImageSequence = parseInt(carousel.getAttribute("data-current-img"));
    let listOfImages = carousel.querySelectorAll(":scope > img");
    let currentImage = listOfImages[currentImageSequence];

    if (!(currentImageSequence == currentImageSequence) || !listOfImages[currentImageSequence + 1]) {
        currentImageSequence = -1;
    }

    currentImageSequence++;
    currentImage.style.opacity = 0;
    currentImage.style.pointerEvents = 'none';
    listOfImages[currentImageSequence].style.opacity = 1;
    listOfImages[currentImageSequence].style.pointerEvents = '';

    updateImgAltBtn(carousel, listOfImages[currentImageSequence]);
    updateCreatorStoreLink(carousel, listOfImages[currentImageSequence]);

    carousel.setAttribute("data-current-img", currentImageSequence)
}

async function autoSwitchImgs (carousel) {
    while (true) {
        if (pointerState[carousel] === false) {
            let delay = await new Promise((resolve, reject) => {
            setTimeout(() => {
                if (pointerState[carousel] === false) {
                    nextImg(carousel)
                } 

                resolve()
            }, 10000);
            })
        } else {
            let delay = await new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve()
            }, 10000);
            })
        }
    }
}


carouselList.forEach((carousel) => {
    // let creatorStoreBtn = carousel.querySelector(".game_creator_store");
    // let altTextBtn = carousel.querySelector(".game_alt_text");
    let nextBtn = carousel.querySelector(".game_next_thumbnail");
    let prevBtn = carousel.querySelector(".game_prev_thumbnail");
    let allImgs = carousel.querySelectorAll(":scope > img")

    nextBtn.addEventListener("click", () => {nextImg(carousel)})
    prevBtn.addEventListener("click", () => {previousImg(carousel)})

    carousel.addEventListener("pointerenter", (event) => {
        pointerState[carousel] = true
        let currentImg = carousel.querySelectorAll(":scope > img")[parseInt(carousel.getAttribute("data-current-img"))] 
        updateImgAltBtn(carousel, currentImg)
        updateCreatorStoreLink(carousel, currentImg)
        applyOpacityToThumbnailBtns(carousel)
    })

    carousel.addEventListener("pointerleave", (event) => {
         if (event.target != carousel) return;
        pointerState[carousel] = false;
        setTimeout(() => {
            if (!pointerState[carousel]) {
                fadeOutAllBtns(carousel)
            }
        }, 1000 * 10);
        
    })

    for (let i = 0; i < allImgs.length; i++) {
        let img = allImgs[i];
        img.style.opacity = 0;
        img.style.pointerEvents = 'none';
    }

    // nextImg(carousel)
    // previousImg(carousel)
    carousel.setAttribute("data-current-img", 0);
    allImgs[0].style.opacity = 1;
    allImgs[0].style.pointerEvents = '';
    updateImgAltBtn(carousel, allImgs[0])
    updateCreatorStoreLink(carousel, allImgs[0])
    applyOpacityToThumbnailBtns(carousel)


    pointerState[carousel] = false;
    setTimeout(() => {
        if (!pointerState[carousel]) {
            fadeOutAllBtns(carousel)
        }
    }, 1000 * 10);

    autoSwitchImgs(carousel)
})

