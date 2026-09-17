import express, {Express} from "express"


const app:Express = express()


app.use(express.static("public"))


app.listen(2373,"0.0.0.0")