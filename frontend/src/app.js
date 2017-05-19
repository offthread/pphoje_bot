import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import ko from 'knockout';

import Router from 'ko-component-router';
import loadingMiddleware from '../middleware/loading';

import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import BootstrapJS from 'bootstrap/dist/js/bootstrap.js';
import styles from '../styles/main.css';

import * as login_template from '../views/login';
import * as shows_template from '../views/shows';

import config from '../config';

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

// Define the routes available for this application (but still, single page)
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

            var initialShows = _.chain(ctx.shows)
                .map( ( show ) => {
                // Data with timestamp is being parsed to D - 1. Y?
                const dateFormated = moment( show.date, 'YYYY-MM-DDZHH:mm' ).add( 1, 'day' ).format( 'YYYY-MM-DD' );
                show.date = dateFormated;
                return show;
            } )
            // Sort by date
            .sortBy( ( show ) => moment( show.date, 'YYYY-MM-DD' ) )
            .value();

            // Save all shows so we can replace when query is empty.
            self.allShows = initialShows;

            // Array of shows, loaded from database.
            self.shows = ko.observableArray( initialShows );
            // Edit show object, initialy a dummy one.
            self.editShow = ko.observable( { name: null, date: '', imgUrl: '', videoUrl: '' } );

            // When editing a show, open the modal with the information of the current show.
            self.showSelectedShow = function( show ) {
                self.editShow( show );
                $( '#showModal' ).modal( 'show' );
            }

            // Open the modal to add a new show info.
            self.addShow = function() {
                $( '#showModal' ).modal( 'show' );
            }

            // Add the show into the array of shows, sorting it by date.
            self.addToArray = ( show ) => {
                self.shows(
                    _.chain( self.shows() )
                    .push( show )
                    .sortBy( ( show ) => {
                        return moment( show.date )
                    } )
                    .value()
                );
            }

            self.removeShow = function ( show ) {
                removeShow( show, self.removeFromArray, ctx )
            }

            // Remove the current show from array (front-end only).
            self.removeFromArray = function( show ) {
                self.shows(
                    _.chain( self.shows() )
                    .remove( show )
                    .value()
                );
            }

            // Update the selected show with the information of the show edited.
            self.updateShow = function( updatedShow ) {
                self.shows( _.map( self.shows(), ( show ) => {
                    if ( updatedShow._id === show._id  ) {
                        return show = updatedShow;
                    }
                    return show;
                } ) );
            }

            // Send to server the request with a new show or a show being edited
            self.editShowSubmit = function() {
                if (this._id) {
                    editShow( this, self.updateShow, ctx );
                } else {
                    insertShow( this, self.addToArray, ctx );
                }
                self.editShow( { name: null, date: '', imgUrl: '', videoUrl: '' } );
                $( '#showModal' ).modal( 'hide' );
            };

            // Locally filter the shows using the search input.
            self.filterShows = function () {
                const query = $( '#search' ).val().toLowerCase().trim();
                if ( query.length ) {
                    self.shows( ko.utils.arrayFilter( self.shows(), ( show ) => {
                        return ko.utils.stringStartsWith( show.name.toLowerCase(), query );
                    } ) );
                } else {
                    self.shows( self.allShows );
                }
            };

            // Bind the enter key to prevent submitting the input.
            $( '#search' ).bind( 'keypress', ( ( event ) => {
                const ENTER_KEY = 13;
                if ( event.which == ENTER_KEY ) {
                    event.preventDefault();
                    self.filterShows();
                }
            } ) );

            // Delay the execution of the search and filter results.
            $( '#search' ).on( 'keyup', _.debounce( ( event ) => {
                event.preventDefault();
                self.filterShows();
            }, 350 ) );
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
      return $.ajax( `${config.api_url}/shows` )
        .then( ( result ) => ctx.shows = result )
    }
}

function loadShow( ctx ) {
    if ( !ctx.show ) {
        return $.ajax( `${config.api_url}/shows` )
            .then( ( result ) => _.filter( ctx.shows, ( show ) => show._id == ctx.params.id ) );
    }
}

function attemptLogin( user, localCtx ) {
    if ( !sessionStorage.getItem( 'authenticated' ) ) {
        return $.ajax( `${config.api_url}/authenticate/`, {
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
            url: `${config.api_url}/shows/`,
            type: 'POST',
            beforeSend: function( xhr ) {
                xhr.setRequestHeader( 'x-access-token', sessionStorage.getItem( 'token' ) );
            },
            data: show
        } )
        .then( result => {
            addFnc( result.show );
        } );
}

function editShow( show, updateFnc, ctx ) {
    return $.ajax( {
            url: `${config.api_url}/shows/` + show._id,
            type: 'PUT',
            beforeSend: function( xhr ) {
                xhr.setRequestHeader( 'x-access-token', sessionStorage.getItem( 'token' ) );
            },
            data: show
        } )
        .then( result => {
            updateFnc( result.show );
        } );
}

function removeShow( show, removeFnc, ctx ) {
    return $.ajax( {
            url: `${config.api_url}/shows/` + show._id,
            type: 'DELETE',
            beforeSend: function( xhr ) {
                xhr.setRequestHeader( 'x-access-token', sessionStorage.getItem( 'token' ) );
            },
            data: show
        } )
        .then( result => {
            removeFnc( result.show );
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