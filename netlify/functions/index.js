const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const serverless = require("serverless-http");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 Cached DB connection for serverless
let isConnected = false;
async function connectDB() {
    if (isConnected) return;
    const db = await mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB connected");
}

// Schema & model
const CustomUrl = new mongoose.Schema({
    originalURL: { type: String, required: true },
    CustomURL: { type: String, required: true },
    Clicks: { type: Number, default: 0 },
});

const CustomURLModel =
    mongoose.models.CustomUrl || mongoose.model("CustomUrl", CustomUrl);

// ✅ Base router for Netlify
const router = express.Router();

router.get("/", (req, res) => {
    res.send("It's Work HDSHORT with Netlify Function 🚀");
});

// add DB API
router.post("/shortner", async (req, res) => {
    try {
        await connectDB();

        const { originalURL } = req.body;

        let code = "";
        const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 5; i++) {
            const randomInd = Math.floor(Math.random() * characters.length);
            code += characters.charAt(randomInd);
        }

        const url = await CustomURLModel.create({
            originalURL: originalURL,
            CustomURL: code,
        });

        return res.status(200).json({
            shortURL: code,
            backEndURL: `https://${req.get("host")}/.netlify/functions/index/${code}`,
            originalURL: originalURL,
            message: "Short url Successfully Add",
            success: true,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error while Add short Name",
            success: false,
        });
    }
});

// custom URL API
router.post("/custom/shortner", async (req, res) => {
    try {
        await connectDB();

        const { originalURL, CustomURL } = req.body;

        const find = await CustomURLModel.findOne({ CustomURL });
        if (find) {
            return res.status(400).json({
                message: "This Custom URL Already Exist",
                success: false,
            });
        }

        await CustomURLModel.create({ originalURL, CustomURL });

        const shortUrl = `https://${req.get("host")}/.netlify/functions/index/${CustomURL}`;

        return res.status(200).json({
            shortURL: CustomURL,
            backEndURL: shortUrl,
            originalURL,
            URL: shortUrl,
            message: "Short url Successfully Add",
            success: true,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Erro while Add short Name",
            success: false,
        });
    }
});

// redirect
router.get("/:code", async (req, res) => {
    try {
        await connectDB();

        const { code } = req.params;
        const find = await CustomURLModel.findOne({ CustomURL: code });
        if (find) {
            return res.redirect(find.originalURL);
        } else {
            return res.status(404).json({
                message: "This URL Not Found",
                success: false,
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Erro while get original URL",
            success: false,
        });
    }
});

// all data api
router.get("/all/record", async (req, res) => {
    try {
        await connectDB();
        const result = await CustomURLModel.find({});
        res.json({ result });
    } catch (error) {
        return res.status(500).json({
            message: "Erro while get ALl Record",
            success: false,
        });
    }
});

// delete particular record
router.delete("/delete/record/:id", async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const result = await CustomURLModel.findByIdAndDelete(id);
        res.json({ result });
    } catch (error) {
        return res.status(500).json({
            message: "Erro while delete Record",
            success: false,
        });
    }
});

// test redirect
router.get("/test", (req, res) => {
    res.redirect(301, "https://www.youtube.com");
});

// ✅ Base path: /.netlify/functions/index
app.use("/.netlify/functions/index", router);

module.exports.handler = serverless(app);
