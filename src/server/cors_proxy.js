const express = require('express');
const router = express.Router();
const cors = require('cors');

// Built to handle GET requests since that's the only types of requests I'm making xd

router.get("/*filepath", cors(), async (req, res) => {
    if (!req.params.filepath || req.params.filepath.length < 3) {
        res.status(400).send("Invalid site.");
        return;
    }

    // console.log(decodeURI(req.url.substring(1)))

    let url = decodeURI(req.url.substring(1));
    let result;

    try {
        result = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        })
        if (!result.ok) throw new Error(`Cannot fulfil request. HTTP ${result.status}`)
        result = await result.json()
    
    } catch (error) {
        console.warn("Error occured while trying to fetch data through proxy!")
        console.log(decodeURI(req.url.substring(1)))
        res.status(result.status).send(error.message);
        return;
    }

    res.json(result)
})

module.exports = router