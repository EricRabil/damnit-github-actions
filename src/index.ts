import dotenv from "dotenv";
import express from "express";
import https from "https";

dotenv.config();

const app = express();

const validatingRegex = /^[a-z0-9\-_.]+$/i;

const validate = (str: string | undefined) => str && str.match(validatingRegex);

app.get("/download", (req, res) => {
    const { username, repo, artifact } = req.query;

    if (username !== process.env.GITHUB_USER_WHITELIST) {
        res.status(401).json({ success: false, error: { status: 401, message: "Username not allowed" } });
        return;
    }

    if (!(validate(username as string) && validate(repo as string) && validate(artifact as string))) {
        res.status(400).json({ success: false, error: { status: 400, message: "Invalid parameters" } });
        return;
    }

    https.get(`https://api.github.com/repos/${username}/${repo}/actions/artifacts/${artifact}/zip`, {
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_SECRET}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.72 Safari/537.36 Edg/90.0.818.42"
        }
    }, gRes => {
        Object.entries(gRes.headers).forEach(([ key, value ]) => res.header(key, value));

        if (gRes.statusCode) res.status(gRes.statusCode);
        
        gRes.pipe(res);
        
        gRes.on("end", () => res.end());
    }).on("error", () => {
        res.status(500).json({ success: false, error: { status: 500, message: "Internal Server Error" } });
    }).end();
});

app.listen(+process.env.PORT! || 8080);