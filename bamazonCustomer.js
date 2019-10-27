var mysql = require("mysql");
var inquirer = require("inquirer");
var cTable = require("console.table");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "root",
  database: "bamazonDB"
});

connection.connect(function(err) {
  if (err) throw err;
  showInventory();
});

function showInventory() {
  console.log("\nShowing inventory...\n");
  var query = connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;

    var shoppingArray = [];
    makeShoppingArray(res, shoppingArray);
    makeTableArray(shoppingArray);
    promptUser();
  });
}

function makeShoppingArray(responseItem, newArray) {
  for (var i = 0; i < responseItem.length; i++) {
    newArray.push([
      responseItem[i].item_id,
      responseItem[i].product_name,
      responseItem[i].department_name,
      responseItem[i].price,
      responseItem[i].stock_quantity
    ]);
  }
}

function makeTableArray(usedArray) {
  console.table(
    ["Item ID", "Product", "Department", "Price", "Quantity"],
    usedArray
  );
}

function promptUser() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "userChoice",
        message: "Which item would you like to purchase?",
        validate: function(value) {
          if ((isNaN(value) === false) & (value > 0) && value < 11) {
            return true;
          }
          return false;
        }
      },
      {
        type: "input",
        name: "quantity",
        message: "How many would you like?",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      }
    ])
    .then(function(result) {
      console.log(result.userChoice);
      var query = connection.query(
        "UPDATE products SET ? WHERE ?",
        [
          {
            stock_quantity: stock_quantity - result.quantity
            // ! stock_quantity is not defined
            // ? Can't figure out the right syntax maybe?
          },
          {
            item_id: result.userChoice
          }
        ],
        function(err, res) {
          if (err) throw err;
          console.log(query);
          console.log(res.affectedRows + " products updated!\n");
          showInventory();
        }
      );
    });
}
