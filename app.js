//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const url = "mongodb+srv://hassaanqaisar2:AmsIRWJATZeuAllj@cluster0.eoyffme.mongodb.net/todolistDB";
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    // Continue with your application logic
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    // Handle the connection error
  });

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);




// currently callback function changed use this way to current callback function
// Item.insertMany(defaultItems)
//   .then(function () {
//     console.log("Successfully saved defult items to DB");
//   })
//   .catch(function (err) {
//     console.log(err);
//   });

app.get("/", function (req, res) {
  Item.find()
    .then((foundItems) => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved defult items to DB");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch((error) => {
      console.error("Error finding documents:", error);
    });
});

app.get("/:customListName", function(req, res){
  const customListName =  _.capitalize(req.params.customListName);

  List.findOne( {name: customListName})
  .then((foundList) => {
    if (!foundList) {
      // create a new list
      const list = new List({
        name: customListName,
        items: defaultItems
      })
    
      list.save();
      res.redirect("/" + customListName);
    } else {
      // show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }
  })
  .catch((error) => {
    console.error('Error finding document:', error);
  });

});




app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today"){
    item.save();

  res.redirect("/");
  }
  else{
    List.findOne({name: listName})
  .then((foundList) => {
    if (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    } else {
      console.log('Document not found');
    }
  })
  .catch((error) => {
    console.error('Error finding document:', error);
  });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    const objectId = checkedItemId;
    Item.findByIdAndRemove(objectId)
    .then((deletedObject) => {
      //console.log('Object deleted:', deletedObject);
      res.redirect("/");
    })
    .catch((err) => {
      console.error(err);
      // Handle the error appropriately
    });
  }
  else{
    List.findOneAndUpdate( {name: listName} , {$pull: {items: {_id: checkedItemId}}}, { new: true })
  .then((foundList) => {
    if (foundList) {
      res.redirect("/" + listName);
    } else {
      console.log('Document not found');
    }
  })
  .catch((error) => {
    console.error('Error updating document:', error);
  });
  }
});


const port = process.env.port || 9001;
app.listen(port, () => console.log("Listening to port " + port));
