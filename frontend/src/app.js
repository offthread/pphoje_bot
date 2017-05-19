import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import ko from 'knockout';

import Router from 'ko-component-router';
import loadingMiddleware from '../middleware/loading'

import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import BootstrapJS from 'bootstrap/dist/js/bootstrap.js';
import styles from '../styles/main.css';

import * as login_template from '../views/login';
import * as shows_template from '../views/shows';

global.moment = moment;

const loading = ko.observable(true);

Router.use( loadingMiddleware( loading ) );
Router.use( ( ctx ) => {
    const isLoginPage = ctx.path === '/login';
    const isLoggedIn = sessionStorage.getItem( 'authenticated' );

    if ( !isLoggedIn && !isLoginPage ) {
        ctx.redirect( '//login' );
    } else if ( isLoggedIn && isLoginPage ) {
        ctx.redirect( '//shows' );
    }
} );

Router.useRoutes( {
        '/': [ checkCredentials, 'home' ],
        '/login': 'login',
        '/shows': {
            '/': [ loadShows, 'shows' ],
            '/:id': [ loadShow, 'show' ]
        }
    }
);

ko.components.register( 'home', {
    template: `<a data-bind="path: '/shows'">Shows</a>`
});

ko.components.register( 'login', {
    viewModel: class LoginViewModel {
        constructor( ctx ) {
            this.errorMessage = ko.observable();
            this.authenticated = ko.observable( false );

            this.authenticated.subscribe( ( isAuthenticated ) => {
                if ( isAuthenticated ) {
                    Router.update( '/shows' );
                }
            } );
        }

        login() {
            const username = $( '#username' ).val();
            const password = $( '#password' ).val();
            attemptLogin( { username, password }, this );
        }

    },
    template: login_template.template
});

ko.components.register( 'shows', {
    viewModel: class ShowsViewModel {
        constructor( ctx ) {
            var self = this;

            var initialShows = ctx.shows.map( ( show ) => {
                const dateFormated = moment( show.date ).format( 'YYYY-MM-DD' );
                show.date = dateFormated;
                return show;
            } );

            self.shows = ko.observableArray( initialShows );
            self.editShow = ko.observable( { name: null, date: '', imgUrl: '', videoUrl: '' } );

            self.addShow = function() {
                $( '#showModal' ).modal( 'show' );
            }

            self.showSelectedShow = function( show ) {
                self.editShow( show );
                $( '#showModal' ).modal( 'show' );
            }

            self.removeShow = function ( show ) {
                self.shows.remove( show );
            }

            self.addToArray = function( show ) {
                self.shows.push( show );
            }

            self.editShowSubmit = function() {
                if (this._id) {
                    // Do nothing for now...
                } else {
                    console.log( this );
                    insertShow( this, self.addToArray, ctx );
                }
                self.editShow( { name: null, date: '', imgUrl: '', videoUrl: '' } );
                $( '#showModal' ).modal( 'hide' );
            }
        }

        logout() {
            sessionStorage.removeItem( 'authenticated' );
            Router.update( '/' );
        }
    },
    template: shows_template.template
});

ko.components.register( 'show', {
    viewModel: class ShowViewModel {
        constructor( ctx ) {
            this.show = ctx.show;
        }
    },
    template: `
               <div data-bind="with: show">
                   <span data-bind="text: name"></span>
                   <a target="_blank" data-bind="attr: { href: link }">Link</a>
                </div>
              `
} );

function loadShows( ctx ) {
    if ( !ctx.shows ) {
      return $.ajax( 'http://192.168.25.166:3000/api/shows' )
        .then( ( result ) => ctx.shows = result )
    }
}

function loadShow( ctx ) {
    if ( !ctx.show ) {
        return $.ajax( 'http://192.168.25.166:3000/api/shows/' )
            .then( ( result ) => _.filter( ctx.shows, ( show ) => show._id == ctx.params.id ) );
    }
}

function attemptLogin( user, localCtx ) {
    if ( !sessionStorage.getItem( 'authenticated' ) ) {
        return $.ajax( 'http://192.168.25.166:3000/api/authenticate/', {
            type: 'POST',
            data: { username: user.username, password: user.password },
            success: ( result ) => {
                if ( result.success ) {
                    sessionStorage.setItem( 'token', result.token );
                    sessionStorage.setItem( 'authenticated', true );
                    localCtx.authenticated( true );
                } else {
                    localCtx.errorMessage( 'Login ou senha inválidos. Tente novamente.' );
                }
            },
            error: ( result ) => {
                localCtx.errorMessage( 'Erro interno. Tente novamente atualizar a página ou volte mais tarde.' );
            }
        } )
    }
}

function insertShow( show, addFnc, ctx ) {
    return $.ajax( {
            url: 'http://192.168.25.166:3000/api/shows/',
            type: 'POST',
            beforeSend: function( xhr ) {
                xhr.setRequestHeader( 'x-access-token', sessionStorage.getItem( 'token' ) );
            },
            data: show
        } )
        .then( result => {
            console.log( result );
            addFnc( result.show );
        } );
}

function checkCredentials( ctx ) {
    if ( sessionStorage.getItem( 'authenticated' ) ) {
        ctx.redirect( '//shows' );
    }
}

const main = () => {
    ko.applyBindings( { loading } );
}

$( document ).ready( () => main() );