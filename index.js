/*
    Index file to export necessary modules
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

//module.exports.Chart = require('./lib/Chart');

CYKParser = require('./lib/CYKParser');
EarleyParser = require('./lib/EarleyParser');
LeftCornerParser = require('./lib/LeftCornerParser');
HeadCornerParser = require('./lib/HeadCornerParser');

function ParserFactory() {}

// Define the prototypes and utilities for this factory

// Our default parserClass is EarleyParser
ParserFactory.prototype.parserClass = EarleyParser;

// Our Factory method for creating new parserinstances
ParserFactory.prototype.createParser = function(options) {

   switch (options.type) {
    case 'CYK': {
      this.parserClass = CYKParser;
    }
    case 'Earley': {
      this.parserClass = EarleyParser;
    }
    case 'LeftCorner': {
      this.parserClass = LeftCornerParser;
    }
    case 'HeadCorner': {
      this.parserClass = HeadCornerParser;
    }
    // defaults to EarleyParser
  } 
  var grammar = GrammarParser.parse(options.grammar_text);

  return new this.parserClass(grammar);
};

module.exports = ParserFactory;