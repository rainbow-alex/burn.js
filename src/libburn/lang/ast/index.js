"use strict";

let ast = module.exports;

ast.Node = CLASS( {
	init: function( properties ) {
		if( properties ) {
			for( let k in properties ) {
				this[k] = properties[k];
			}
		}
	},
} );

//
// Expressions
//

ast.Expression = CLASS( ast.Node );

ast.NothingLiteral = CLASS( ast.Expression );
ast.BooleanLiteral = CLASS( ast.Expression );
ast.IntegerLiteral = CLASS( ast.Expression );
ast.FloatLiteral = CLASS( ast.Expression );
ast.StringLiteral = CLASS( ast.Expression );
ast.BytesLiteral = CLASS( ast.Expression );

ast.VariableExpression = CLASS( ast.Expression );
ast.IdentifierExpression = CLASS( ast.Expression );
ast.ThisExpression = CLASS( ast.Expression );

ast.ParenthesizedExpression = CLASS( ast.Expression );
ast.TupleLiteral = CLASS( ast.Expression );
ast.ListLiteral = CLASS( ast.Expression );

ast.FunctionExpression = CLASS( ast.Expression );
ast.ClassExpression = CLASS( ast.Expression );

	ast.CallArgument = CLASS( ast.Node );
	ast.CallableParameter = CLASS( ast.Node );
	ast.ClassProperty = CLASS( ast.Node );
	ast.ClassMethod = CLASS( ast.Node );

ast.NewExpression = CLASS( ast.Expression );

ast.CallExpression = CLASS( ast.Expression );
ast.PropertyExpression = CLASS( ast.Expression );
ast.IndexExpression = CLASS( ast.Expression );

ast.IntersectionExpression = CLASS( ast.Expression );
ast.UnionExpression = CLASS( ast.Expression );

ast.MulExpression = CLASS( ast.Expression );
ast.DivExpression = CLASS( ast.Expression );

ast.AddExpression = CLASS( ast.Expression );
ast.SubExpression = CLASS( ast.Expression );

ast.IsExpression = CLASS( ast.Expression );
ast.IsNotExpression = CLASS( ast.Expression );
ast.EqExpression = CLASS( ast.Expression );
ast.NeqExpression = CLASS( ast.Expression );
ast.LtExpression = CLASS( ast.Expression );
ast.GtExpression = CLASS( ast.Expression );
ast.LteqExpression = CLASS( ast.Expression );
ast.GteqExpression = CLASS( ast.Expression );

ast.NotExpression = CLASS( ast.Expression );
ast.AndExpression = CLASS( ast.Expression );
ast.OrExpression = CLASS( ast.Expression );

//
// Lvalues
//

ast.Lvalue = CLASS( ast.Node );

ast.VariableLvalue = CLASS( ast.Lvalue );
ast.PropertyLvalue = CLASS( ast.Lvalue );
ast.IndexLvalue = CLASS( ast.Lvalue );

//
// Statements
//

ast.Statement = CLASS( ast.Node );
ast.Block = CLASS( ast.Node );
ast.Annotation = CLASS( ast.Node );

ast.ExpressionStatement = CLASS( ast.Statement );
ast.AssignmentStatement = CLASS( ast.Statement );

ast.BreakStatement = CLASS( ast.Statement );
ast.ContinueStatement = CLASS( ast.Statement );
ast.ImportStatement = CLASS( ast.Statement );
ast.IncludeStatement = CLASS( ast.Statement );
ast.LetStatement = CLASS( ast.Statement );
ast.PrintStatement = CLASS( ast.Statement );
ast.ReturnStatement = CLASS( ast.Statement );
ast.ThrowStatement = CLASS( ast.Statement );

ast.ForInStatement = CLASS( ast.Statement );
ast.IfStatement = CLASS( ast.Statement );
ast.TryStatement = CLASS( ast.Statement );
ast.WhileStatement = CLASS( ast.Statement );

	ast.ElseIfClause = CLASS( ast.Node );
	ast.ElseClause = CLASS( ast.Node );
	ast.CatchClause = CLASS( ast.Node );
	ast.FinallyClause = CLASS( ast.Node );

//
// Root node
//

ast.Root = CLASS( ast.Node );

// ***

// Create a helpful toString for every Node type
for( let k in ast ) {
	if( ast[k].prototype instanceof ast.Node ) {
		ast[k].prototype.toString = function() {
			return "<ast." + k + ">";
		}
	}
}

require( "./_resolve.inc.js" );
require( "./_compile.inc.js" );
require( "./_toJSON.inc.js" );
