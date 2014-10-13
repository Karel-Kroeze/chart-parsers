/*
    DoubleDottedItem class
    Copyright (C) 2014 Hugo W.L. ter Doest

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var typeOf = require('typeof');
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.setLevel('DEBUG');

var CYK_Item = require('./CYK_Item');

// Creates an item; 
// left_dot is an index in the RHS of the rule as well as right_dot
// from is the starting point in the sentence
// Data structure is prepared for InfoVis
function DoubleDottedItem(rule, left_dot, right_dot, from, to) {

  logger.debug("Enter DoubleDottedItem( " + rule + ", " + left_dot + ", " + right_dot + ", " + from + ", " + to + ")");
  // A unique identifier is constructed from rule, dot and from
  this.id = "DoubleDottedItem(" + rule.lhs + "->" + rule.rhs + ", " + left_dot + ", " + right_dot + ", " + from + ", " + to +")";
  this.name = rule.lhs;
  this.children = [];

  this.data = {};
  this.data.rule = rule;
  this.data.left_dot = left_dot;
  this.data.right_dot = right_dot;
  this.data.from = from;
  this.data.to = to;
  logger.debug("Enter DoubleDottedItem: created item: " + this.id);
}

module.exports = DoubleDottedItem;

var GoalItem = require('./GoalItem');

// Create a copy of the item including the children
DoubleDottedItem.prototype.copy = function() {
  var new_item = new DoubleDottedItem(this.data.rule, this.data.left_dot, this.data.right_dot, this.data.from, this.data.to);
  new_item.children = this.children.slice();
  return(new_item);
};

// Checks if an item is incomplete
DoubleDottedItem.prototype.is_incomplete = function () {
  return(!this.is_complete());
};

// Checks if an item is complete
DoubleDottedItem.prototype.is_complete = function () {
  return((this.data.left_dot === 0) && (this.data.right_dot === this.data.rule.rhs.length));
};

DoubleDottedItem.prototype.combine_with_chart = function(chart, agenda, grammar) {
  logger.debug("Enter DoubleDottedItem.combine_with_chart:" + this.id);
  this.pre_complete(chart, agenda, grammar);
  this.left_predict(chart, agenda, grammar);
  this.right_predict(chart, agenda, grammar);
  this.left_complete(chart, agenda, grammar);
  this.right_complete(chart, agenda, grammar);
};

DoubleDottedItem.prototype.pre_complete = function (chart, agenda, grammar) {
  var nr_items_added = 0;

  logger.debug("Enter DoubleDottedItem.pre_complete:" + this.id);
  if (this.is_complete()) {
    var new_item = new CYK_Item(this.data.rule.lhs, this.data.from, this.data.to);
    nr_items_added += agenda.add_item(new_item);
  }
  logger.debug("Exit DoubleDottedItem.pre_complete: number of items added: " + nr_items_added);
  return(nr_items_added);
};

DoubleDottedItem.prototype.left_predict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  // Get goal items that end at the "to" of the current item
  logger.debug("Enter DoubleDottedItem.left_predict:" + this.id);
  var items = chart.get_items_to(this.data.to);
  items.forEach(function(item) {
    if (typeOf(item) === "goalitem") { // try to combine with the current item
      if (grammar.is_headcorner_of(that.data.rule.lhs, item.nonterminal)) {
        for (var i = item.data.from; i <= that.data.from; i++) {
          for (var j = i; i < that.data.from; j++) {
            var new_goal = new GoalItem(i, j, that.data.rule.rhs[that.data.left_dot]);
            nr_items_added += agenda.add_item(new_goal);
          }
        }
      }
    }
  });
  logger.debug("Exit DoubleDottedItem.left_predict: number of items added: " + nr_items_added);
  return(nr_items_added);
};

DoubleDottedItem.prototype.right_predict = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  // Get goal items that start at the "from" of the current item
  var items = chart.get_items_from(this.data.from);
  items.forEach(function(item) {
    if (typeOf(item) === "goalitem") { // try to combine with the current item
      if (grammar.is_headcorner_of(that.data.rule.lhs, item.data.nonterminal)) {
        for (var j = that.data.to; j <= item.data.to; j++) {
          for (var k = j; k <= item.data.to; k++) {
            var new_goal = new GoalItem(j, k, that.data.rule.rhs[that.data.right_dot]);
            nr_items_added += agenda.add_item(new_goal);
          }
        }
      }
    }
  });
  return(nr_items_added);
};

DoubleDottedItem.prototype.left_complete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  // Get goal items that end at the "to" of the current item
  var items1 = chart.get_items_to(this.data.to);
  items1.forEach(function(item1) {
    if (typeOf(item1) === "goalitem") { // find completed items to combine with
      var items2 = chart.get_items_from_to(item1.data.from, that.data.to);
      items2.forEach(function(item2) {
        if ((typeOf(item2) === "cyk_item") &&
            (that.data.rule.rhs[that.data.left_dot] === item2.data.nonterminal) &&
            grammar.is_headcorner_of(that.data.rule.lhs, item1.data.nonterminal)) {
          var new_item = new DoubleDottedItem(that.data.rule, that.data.left_dot-1, that.data.right_dot, item1.data.from, item1.data.to);
          new_item.children = that.children.slice();
          new_item.children.unshift(item2);
          nr_items_added += agenda.add_item(new_item);
        }
      });
    }
  });
  return(nr_items_added);
};

DoubleDottedItem.prototype.right_complete = function (chart, agenda, grammar) {
  var that = this;
  var nr_items_added = 0;

  // Get goal items that start at the "from" of the current item
  var items1 = chart.get_items_from(this.data.from);
  items1.forEach(function(item1) {
    if (typeOf(item1) === "goalitem") { // find completed items to combine with
      var items2 = chart.get_items_from_to(that.data.from, item1.to);
      items2.forEach(function(item2) {
        if ((typeOf(item2) === "cyk_item") && 
            (that.data.rule.rhs[that.data.right_dot] === item2.data.nonterminal) &&
            grammar.is_headcorner_of(that.data.rule.lhs, item1.nonterminal)) {
          var new_item = new DoubleDottedItem(that.data.rule, that.data.left_dot, that.data.right_dot+1, item1.from, item1.to);
          new_item.set_children(that.children.slice());
          new_item.add_child(item2);
          nr_items_added += agenda.add_item(new_item);
        }
      });
    }
  });
  return(nr_items_added);
};

module.exports = DoubleDottedItem;