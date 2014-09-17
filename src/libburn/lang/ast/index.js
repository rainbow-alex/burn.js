"use strict";

exports.Node = CLASS( {
	init: function( properties ) {
		if( properties ) {
			for( let k in properties ) {
				this[k] = properties[k];
			}
		}
	},
} );

exports.Root = CLASS( exports.Node );
exports.Block = CLASS( exports.Node );

exports.Annotation = CLASS( exports.Node );

exports.Statement = CLASS( exports.Node );
exports.BreakStatement = CLASS( exports.Statement );
exports.ContinueStatement = CLASS( exports.Statement );
exports.ForInStatement = CLASS( exports.Statement );
exports.IfStatement = CLASS( exports.Statement );
exports.ImportStatement = CLASS( exports.Statement );
exports.IncludeStatement = CLASS( exports.Statement );
exports.LetStatement = CLASS( exports.Statement );
exports.PrintStatement = CLASS( exports.Statement );
exports.ReturnStatement = CLASS( exports.Statement );
exports.ThrowStatement = CLASS( exports.Statement );
exports.TryStatement = CLASS( exports.Statement );
exports.WhileStatement = CLASS( exports.Statement );
exports.ExpressionStatement = CLASS( exports.Statement );
exports.AssignmentStatement = CLASS( exports.Statement );

exports.ElseIfClause = CLASS( exports.Node );
exports.ElseClause = CLASS( exports.Node );
exports.CatchClause = CLASS( exports.Node );
exports.FinallyClause = CLASS( exports.Node );

exports.Expression = CLASS( exports.Node );
exports.AndExpression = CLASS( exports.Expression );
exports.OrExpression = CLASS( exports.Expression );
exports.NotExpression = CLASS( exports.Expression );
exports.IsExpression = CLASS( exports.Expression );
exports.EqExpression = CLASS( exports.Expression );
exports.NeqExpression = CLASS( exports.Expression );
exports.LtExpression = CLASS( exports.Expression );
exports.GtExpression = CLASS( exports.Expression );
exports.LteqExpression = CLASS( exports.Expression );
exports.GteqExpression = CLASS( exports.Expression );
exports.UnionExpression = CLASS( exports.Expression );
exports.AddExpression = CLASS( exports.Expression );
exports.SubExpression = CLASS( exports.Expression );
exports.MulExpression = CLASS( exports.Expression );
exports.DivExpression = CLASS( exports.Expression );
exports.CallExpression = CLASS( exports.Expression );
exports.PropertyExpression = CLASS( exports.Expression );
exports.IndexExpression = CLASS( exports.Expression );
exports.FunctionExpression = CLASS( exports.Expression );
exports.ParenthesizedExpression = CLASS( exports.Expression );
exports.IdentifierExpression = CLASS( exports.Expression );
exports.VariableExpression = CLASS( exports.Expression );
exports.ListLiteral = CLASS( exports.Expression );
exports.StringLiteral = CLASS( exports.Expression );
exports.IntegerLiteral = CLASS( exports.Expression );
exports.FloatLiteral = CLASS( exports.Expression );
exports.BooleanLiteral = CLASS( exports.Expression );
exports.NothingLiteral = CLASS( exports.Expression );

exports.CallArgument = CLASS( exports.Node );
exports.FunctionParameter = CLASS( exports.Node );

exports.Lvalue = CLASS( exports.Node );
exports.VariableLvalue = CLASS( exports.Lvalue );
exports.PropertyLvalue = CLASS( exports.Lvalue );
exports.IndexLvalue = CLASS( exports.Lvalue );

for( let k in exports ) {
	if( exports[k].prototype instanceof exports.Node ) {
		exports[k].prototype.toString = function() {
			return "<ast." + k + ">";
		}
	}
}

require( "./_resolve.inc.js" );
require( "./_compile.inc.js" );
require( "./_toJSON.inc.js" );
