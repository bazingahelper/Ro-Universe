let searchbarArray = document.querySelectorAll('.header_search')
let searchOverlay = document.querySelector('.search_overlay')
let selectedBtn

function searchOverlayClicked(event) {
    if (searchOverlay.contains(event.target)) {
        searchOverlay.style.display = ""
    }
    for (let i = 0; i < searchbarArray.length; i++) {
        let searchbarContainer = searchbarArray[i]
        if (searchbarContainer.contains(event.target)) {
            return
        }
    }

    searchOverlay.style.display = "none"
}

function respondToSearchedChanges(event) {
    let searchbar = event.currentTarget
    let searchPlr = searchOverlay.querySelector('.search_players > a')
    let searchGame = searchOverlay.querySelector('.search_games > a')
    let searchGroup = searchOverlay.querySelector('.search_group > a') 

    let searchQuery = searchbar.value

    searchbarArray.forEach((searchbarContainer) => {
        let searchbar = searchbarContainer.querySelector('input')
        let clearBtn = searchbarContainer.querySelector('.header_clearbtn')

        searchbar.value = searchQuery

        if (searchQuery.length > 0) {
            clearBtn.style.display = ""
        }
        else {
            clearBtn.style.display = "none"
        }

    })

     // checks if non-digits are present in searchbar
    if (searchQuery.length == 0 || searchQuery.match(/\D/)) {
        searchOverlay.style.display = "none"
    } else {
        searchPlr.querySelector('b').textContent = searchQuery
        searchPlr.setAttribute("href", `/users/${searchQuery}`)

        searchGame.querySelector('b').textContent = searchQuery
        searchGame.setAttribute("href", `/games/${searchQuery}`)

        searchGroup.querySelector('b').textContent = searchQuery
        searchGroup.setAttribute("href", `/groups/${searchQuery}`)
        searchOverlay.style.display = ""
    }    
}

function setHoveredBtn(hoveredOption) {
    selectedBtn = hoveredOption;
    let searchPlr = searchOverlay.querySelector('.search_players')
    let searchGame = searchOverlay.querySelector('.search_games')
    let searchGroup = searchOverlay.querySelector('.search_group') 
    let arrayOfBtn = [searchPlr, searchGame, searchGroup];
    arrayOfBtn.forEach((btn) => {
        if (btn == hoveredOption) btn.style.backgroundColor = `#e5e3e3`;
        else btn.style.backgroundColor = ``;
    })

}

function openHoveredBtn() {
    selectedBtn.querySelector('a').click();
}


searchbarArray.forEach((searchbarContainer) => {
    let searchPromptBtn = searchbarContainer.querySelector('.header_searchbtn')
    let searchbar = searchbarContainer.querySelector('input')
    let clearBtn = searchbarContainer.querySelector('.header_clearbtn')

    searchbar.addEventListener('input', function(event) {respondToSearchedChanges(event, searchbarContainer)})
    searchbar.addEventListener('focus', function(event) {respondToSearchedChanges(event, searchbarContainer)})
    // searchbar.addEventListener('focusout', hideSearchOverlay)
    document.addEventListener('click', searchOverlayClicked)

    searchPromptBtn.addEventListener('click', () => {searchbar.focus()})
    clearBtn.addEventListener('click', () => {
        searchbar.value = ""
        let inputEvent = new Event('input')
        searchbar.dispatchEvent(inputEvent)
    } )

    let inputEvent = new Event('input')
    searchbar.dispatchEvent(inputEvent)

    searchOverlay.style.display = "none"
})

document.addEventListener('keyup', (event) => {
    let searchPlr = searchOverlay.querySelector('.search_players')
    let searchGame = searchOverlay.querySelector('.search_games')
    let searchGroup = searchOverlay.querySelector('.search_group') 

    if (searchOverlay.style.display === "none") return;
    if (event.key === "ArrowUp") {
        let arrayOfBtn = [searchPlr, searchGame, searchGroup];
        let originalIndex = arrayOfBtn.findIndex((element) => {
            return element === (selectedBtn || searchPlr)
        });

        if (originalIndex <= 0) originalIndex = 3
        setHoveredBtn(arrayOfBtn[originalIndex - 1])
    } else if (event.key === "ArrowDown") {
        let arrayOfBtn = [searchGroup, searchGame, searchPlr];
        let originalIndex = arrayOfBtn.findIndex((element) => {
            return element === (selectedBtn || searchPlr)
        });

        if (originalIndex <= 0) originalIndex = 3
        setHoveredBtn(arrayOfBtn[originalIndex - 1])

    } else if (event.key === "Enter") {
        openHoveredBtn();
    }
})

searchOverlay.querySelectorAll("ul > li").forEach((btn) => {
    btn.addEventListener("pointerenter", (event) => {
        setHoveredBtn(event.currentTarget)
    });
});

setHoveredBtn(searchOverlay.querySelector('.search_players'));