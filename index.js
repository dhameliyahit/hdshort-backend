const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")
dotenv.config();
const app = express()

app.use(cors());
app.use(express.json());

// mongo Connection
mongoose.connect(process.env.DB_URL)
    .then((res) => console.log(`DB connection SuccessFully`))
    .catch((err) => console.log(`Error While DB connect`))
// schema & model

const CustomUrl = new mongoose.Schema({
    originalURL: { type: String, required: true },
    CustomURL: { type: String, required: true },
    Clicks: { type: Number, default: 0 }
})

const CustomURLModel = mongoose.model("CustomUrl", CustomUrl);

app.get("/", (req, res) => {
    res.send("It's Work HDSHORT")
})

// add DB API
app.post("/api/v1/shortner", async (req, res) => {
    try {
        const { originalURL } = req.body;

        let code = '';
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';


        for (let i = 0; i < 5; i++) {
            const randomInd = Math.floor(Math.random() * characters.length);
            code += characters.charAt(randomInd);
        }
        const url = await CustomURLModel.create({ originalURL: originalURL, CustomURL: code })
        url.save()

        return res.status(200).json({
            shortURL: code,
            backEndURL: `${req.protocol}://${req.get("host")}`,
            originalURL: originalURL,
            message: "Short url Successfully Add",
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Erro while Add short Name",
            success: false
        })
    }
});

//custom URL API
app.post("/api/v1/custom/shortner", async (req, res) => {
    try {
        const { originalURL, CustomURL } = req.body;

        const find = await CustomURLModel.findOne({ CustomURL: CustomURL });
        if (find) {
            return res.status(400).json({
                message: "This Custom URL Already Exist",
                success: false
            })
        }

        const url = await CustomURLModel.create({ originalURL: originalURL, CustomURL: CustomURL })
        url.save()

        return res.status(200).json({
            shortURL: CustomURL,
            backEndURL: `${req.protocol}://${req.get("host")}`,
            originalURL: originalURL,
            URL: `${req.protocol}://${req.get("host")}/${CustomURL}`,
            message: "Short url Successfully Add",
            success: true
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Erro while Add short Name",
            success: false
        })
    }
});

app.get("/:code", async (req, res) => {
    try {

        const { code } = req.params;
        const find = await CustomURLModel.findOne({ CustomURL: code });
        if (find) {
            res.redirect(find.originalURL);
        } else {
            return res.status(404).json({
                message: "This URL Not Found",
                success: false
            })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Erro while get original URL",
            success: false
        })
    }
})

// all data api
app.get("/all/record", async (req, res) => {
    try {
        const result = await CustomURLModel.find({})
        res.json({ result: result })
    } catch (error) {
        return res.status(500).json({
            message: "Erro while get ALl Record",
            success: false
        })
    }
})


// delete perticlur record
app.delete("/delete/record/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await CustomURLModel.findByIdAndDelete(id)
        res.json({ result: result })
    } catch (error) {
        return res.status(500).json({
            message: "Erro while get ALl Record",
            success: false
        })
    }
})


//redireact test

app.get("/test", (req, res) => {
    res.redirect(301, "https://www.youtube.com")
})


// listen server
app.listen(process.env.PORT, () => {
    console.log(`Server is Running on ${process.env.PORT}`);
})