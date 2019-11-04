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
  welcomeScreen();
});

function welcomeScreen() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "choice",
        message: "Which menu would you like to view?\n",
        choices: [
          new inquirer.Separator(),
          "Bamazon Customer",
          "Bamazon Manager",
          new inquirer.Separator(),
          "End Connection"
        ]
      }
    ])
    .then(function(result) {
      if (result.choice === "Bamazon Customer") {
        customerShop();
      } else if (result.choice === "Bamazon Manager") {
        manager();
      } else {
        connection.end();
      }
    });
}

function customerShop() {
  console.log("\nShowing inventory...\n");
  var query = connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;

    var shoppingArray = [];
    makeShoppingArray(res, shoppingArray);
    makeTableArray(shoppingArray);

    inquirer
      .prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Do you want to purchase something?",
          default: true
        }
      ])
      .then(function(result) {
        if (result.confirm) {
          promptUser(res);
        } else {
          welcomeScreen();
        }
      });
  });
}

function managerShop() {
  console.log("\nShowing inventory...\n");
  var query = connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;

    var shoppingArray = [];
    makeShoppingArray(res, shoppingArray);
    makeTableArray(shoppingArray);
    manager();
    // inquirer
    //   .prompt([
    //     {
    //       type: "confirm",
    //       name: "confirm",
    //       message: "Do you want to purchase something?",
    //       default: true
    //     }
    //   ])
    //   .then(function(result) {
    //     if (result.confirm) {
    //       promptUser(res);
    //     } else {
    //       manager();
    //     }
    //   });
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

function promptUser(dbResponse) {
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
      var userQuantity = parseInt(result.quantity);
      if (userQuantity > dbResponse[result.userChoice - 1].stock_quantity) {
        console.log(
          "You cannot purchase more than we have in stock\nPlease try again"
        );
        customerShop();
      } else {
        var query = connection.query(
          "UPDATE products SET stock_quantity = stock_quantity - " +
            userQuantity +
            " WHERE ?",
          [
            {
              item_id: result.userChoice
            }
          ],
          function(err, res) {
            if (err) throw err;
            console.log(
              "\n======================\n" +
                "\nProducts updated!\n" +
                "Your total is $" +
                dbResponse[result.userChoice - 1].price * result.quantity +
                "\n\n======================"
            );
            customerShop();
          }
        );
      }
    });
}

function manager() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "managerChoice",
        message: "Choose an option\n",
        choices: [
          new inquirer.Separator(),
          "View Inventory",
          "View Low Inventory",
          "Add Inventory",
          "Add New Product",
          new inquirer.Separator(),
          "< Back",
          "End Connection"
        ]
      }
    ])
    .then(function(result) {
      switch (result.managerChoice) {
        case "View Inventory":
          managerShop();
          break;
        case "View Low Inventory":
          viewLowInventory();
          break;
        case "Add Inventory":
          addToInventory();
          break;
        case "Add New Product":
          addNewProduct();
          break;
        case "< Back":
          welcomeScreen();
          break;
        case "End Connection":
          connection.end();
          break;
      }
    });
}

function viewLowInventory() {
  var query = connection.query(
    "SELECT * FROM products WHERE stock_quantity < 10",
    function(err, res) {
      if (err) throw err;

      var lowQuantityArray = [];

      console.log("\n");
      makeShoppingArray(res, lowQuantityArray);
      makeTableArray(lowQuantityArray);

      manager();
    }
  );
}

function addToInventory() {
  console.log("\nShowing inventory...\n");
  var query = connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;

    var shoppingArray = [];
    makeShoppingArray(res, shoppingArray);
    makeTableArray(shoppingArray);

    inquirer
      .prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Do you want to add an item?"
        }
      ])
      .then(function(result) {
        if (result.confirm) {
          inquirer
            .prompt([
              {
                type: "input",
                name: "userChoice",
                message: "Which item do you want to add to?"
              },
              {
                type: "input",
                name: "quantity",
                message: "How many do you want to add?"
              }
            ])
            .then(function(result) {
              var query = connection.query(
                "UPDATE products SET stock_quantity = stock_quantity + " +
                  result.quantity +
                  " WHERE ?",
                [
                  {
                    item_id: result.userChoice
                  }
                ],
                function(err, res) {
                  if (err) throw err;
                  console.log(
                    "\n======================\n" +
                      "\nProducts updated!\n" +
                      "\n======================"
                  );
                  manager();
                }
              );
            });
        } else {
          manager();
        }
      });
  });
}

function addNewProduct() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "name",
        message: "What item are you adding?"
      },
      {
        type: "input",
        name: "department",
        message: "What department will this item be in?"
      },
      {
        type: "input",
        name: "price",
        message: "How much is the item? (each)",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      },
      {
        type: "input",
        name: "quantity",
        message: "How many are you adding?",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      }
    ])
    .then(function(result) {
      var query = connection.query(
        "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES ('" +
          result.name +
          "', '" +
          result.department +
          "', " +
          result.price +
          ", " +
          result.quantity +
          ")"
      );
      console.log(
        "\n======================\n" +
          "\nYour product: '" +
          result.name +
          "' was added successfully!\n" +
          "\n======================"
      );
      manager();
    });
}
