
const express = require("express");       // 引入 Express 框架
const { MongoClient, ObjectId  } = require("mongodb"); // 引入 MongoDB 客户端
const formidable = require('formidable');
const path = require("path");
const cors = require("cors");
require("dotenv").config();

//初始化 Express 应用
const app = express();
app.use(cors());
app.use(express.json()); // 允许接收 JSON 格式的请求体
app.use(express.urlencoded({ extended: true }));//解析普通表单表单数据

const PORT = 3000;

//使用dotenv 来隐藏 MongoDB 的连接字符串
const mongo_url = process.env.MONGO_URL;
const client = new MongoClient(mongo_url);

let db, collection;

async function connectToDatabase() {
    try {
        await client.connect(); // 等待连接 MongoDB  
        db = client.db("new_data_base"); // 指定数据库名称 选择或创造
        collection = db.collection("class_assignment_collection_2-1"); // 指定集合（相当于表）选择或创造
        console.log("✅ 已连接到 MongoDB 云数据库！");
    } catch (error) {
        console.error("❌ 数据库连接出错：", error);
    }
}

//提供了多个 API 路由

//进入主页
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));//__dirname 是 server.js 所在目录   sendFile() 是 Express 提供的方法 自动设置好响应头（如 Content-Type）把它的内容发送到浏览器中显示
});

// 处理表单 POST 请求
app.post("/upload_data", async (req, res) => {
    if (!collection) return res.status(500).send("数据库未连接");
    const my_form_data = {
        u_name: req.body.u_name,
        u_age: req.body.u_age,
        u_city: req.body.u_city,
        u_hobby: req.body.u_hobby
    };
    try {
        await collection.insertOne(my_form_data);
        // res.send("✅ 数据已成功保存到 MongoDB！");
        res.json({ success: true, message: "✅ 数据已成功保存到 MongoDB！" });
    } catch (err) {
        console.error("❌ 插入失败：", err);
        // res.status(500).send("数据库操作失败");
        res.status(500).json({ success: false, error: "数据库操作失败" });
    }
});

// 查询一条
app.get("/show_one", async (req, res) => {
    if (!collection) return res.status(500).send("数据库未连接");
    const doc = await collection.findOne();// 查找一条
    res.send(doc);
});

// 查询多条
app.get("/show_many", async (req, res) => {
    if (!collection) return res.status(500).send("数据库未连接");
    const cursor = await collection.find();     // 拿到全部数据的 cursor
    const result = await cursor.toArray();      // 转成数组
    res.send(result);
});

// 筛选查询
app.get("/filtered", async (req, res) => {
    if (!collection) return res.status(500).send("数据库未连接");
    const filter = { city_name: "多伦多" }; // 条件
    const result = await collection.find(filter).toArray();
    res.send(result);
});


// delete one
app.delete('/delete/:id', async (req, res) => {
  if (!collection) return res.status(500).send("数据库未连接");

  const id = req.params.id;

  // ✅ 关键：先检查 id 格式是否合法
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: '非法 ID 格式' });
  }

  try {
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(404).json({ success: false, message: '未找到记录' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});


//修改数据
app.put("/update/:id", async (req, res) => {
  if (!collection) return res.status(500).send("数据库未连接");

  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: '非法 ID' });
  }

  const updatedData = {
    u_name: req.body.u_name,
    u_age: req.body.u_age,
    u_city: req.body.u_city,
    u_hobby: req.body.u_hobby
  };

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: '记录未找到或无更改' });
    }
  } catch (err) {
    console.error("更新失败:", err);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});


// 连接数据库后再启动服务
connectToDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 http://localhost:${PORT}`);
    });
});
