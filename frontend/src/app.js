import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import ko from 'knockout';

import Router from 'ko-component-router';
import loadingMiddleware from '../middleware/loading';

import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import BootstrapJS from 'bootstrap/dist/js/bootstrap.js';
import styles from '../styles/main.css';
import swal from 'sweetalert/dist/sweetalert.min.js';
import swalCss from 'sweetalert/dist/sweetalert.css';

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
            loading( true );
        }

    },
    template: login_template.template
});

ko.components.register( 'shows', {
    viewModel: class ShowsViewModel {
        constructor( ctx ) {
            var self = this;

            const initialShows = getInitialShows( ctx.shows );

            // Save all shows so we can replace when query is empty.
            self.allShows = initialShows;

            // Array of shows, loaded from database.
            self.shows = ko.observableArray( initialShows );
            // Edit show object, initialy a dummy one.
            self.editShow = ko.observable( { name: null, date: '', imgUrl: '', videoUrl: '' } );

            // Check input values are filled
            self.addOrEditFilled = ko.observable( true );

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
            self.addNewShow = ( show ) => {
                const dateFormated = moment( show.date, 'YYYY-MM-DDZHH:mm' ).add( 1, 'day' ).format( 'YYYY-MM-DD' );
                show.date = dateFormated;

                console.log(  show.date );

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
                swal( {
                    title: "Tem certeza?",
                    text: "Não será possível recuperar este evento!",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Sim, remova o evento!",
                    cancelButtonText: "Cancelar",
                    closeOnConfirm: true
                },
                function() {
                    removeShow( show, self.removeFromArray, ctx );
                } );
            }

            // Remove the current show from array (front-end only).
            self.removeFromArray = function( removedShow ) {
                self.shows(
                    _.chain( self.shows() )
                    .filter( ( show ) => show._id !== removedShow._id )
                    .value()
                );
            }

            // Update the selected show with the information of the show edited.
            self.updateShow = function( updatedShow ) {
                self.shows( _.map( self.shows(), ( show ) => {
                    if ( updatedShow._id === show._id  ) {
                        const dateFormated = moment( updatedShow.date, 'YYYY-MM-DDZHH:mm' ).add( 1, 'day' ).format( 'YYYY-MM-DD' );
                        updatedShow.date = dateFormated;
                        return updatedShow;
                    }
                    return show;
                } ) );
            }

            // Send to server the request with a new show or a show being edited
            self.editShowSubmit = function() {
                const modalInputDate = $( '#date' ).val();
                const modalInputName = $( '#name' ).val();
                const modalInputVideoUrl = $( '#videoUrl' ).val();
                const modalInputImageUrl = $( '#imgUrl' ).val();

                function isFilled( value ) {
                    return value && value.length > 0 && value.trim().length > 0 ? true : false;
                }

                const filledAllInputs = isFilled( modalInputDate ) && isFilled( modalInputName ) &&
                    isFilled( modalInputVideoUrl ) && isFilled( modalInputImageUrl );
                if ( !filledAllInputs ) {
                    self.addOrEditFilled( false );
                    return;
                }

                self.addOrEditFilled( true );
                loading( true );
                if (this._id) {
                    editShow( this, self.updateShow, ctx );
                } else {
                    insertShow( this, self.addNewShow, ctx );
                }
                
                self.cancelAction();
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

            self.cancelAction = function() {
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

function getInitialShows( shows ) {
    return _.chain( shows )
        .map( ( show ) => {
        // Data with timestamp is being parsed to D - 1. Y?
        const dateFormated = moment( show.date, 'YYYY-MM-DDZHH:mm' ).add( 1, 'day' ).format( 'YYYY-MM-DD' );
        show.date = dateFormated;
        return show;
    } )
    // Sort by date
    .sortBy( ( show ) => moment( show.date, 'YYYY-MM-DD' ) )
    .value();

}

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
                loading( false );
            },
            error: ( result ) => {
                localCtx.errorMessage( 'Erro interno. Tente novamente atualizar a página ou volte mais tarde.' );
                loading( false );
            }
        } )
    }
}

function insertShow( show, addFn, ctx ) {
    return $.ajax( {
            url: `${config.api_url}/shows/`,
            type: 'POST',
            beforeSend: function( xhr ) {
                xhr.setRequestHeader( 'x-access-token', sessionStorage.getItem( 'token' ) );
            },
            data: show
        } )
        .then( result => {
            const opts = {
                success: result.success,
                action: 'adicionado',
                show: result.show,
                nextFn: addFn
            }

            handleResponse( opts );

            loading( false );
        } );
}

function editShow( show, updateFn, ctx ) {
    return $.ajax( {
            url: `${config.api_url}/shows/` + show._id,
            type: 'PUT',
            beforeSend: function( xhr ) {
                xhr.setRequestHeader( 'x-access-token', sessionStorage.getItem( 'token' ) );
            },
            data: show
        } )
        .then( result => {
            const opts = {
                success: result.success,
                action: 'alterado',
                show: result.show,
                nextFn: updateFn
            }

            handleResponse( opts );

            loading( false );
        } );
}

function removeShow( show, removeFn, ctx ) {
    return $.ajax( {
            url: `${config.api_url}/shows/` + show._id,
            type: 'DELETE',
            beforeSend: function( xhr ) {
                xhr.setRequestHeader( 'x-access-token', sessionStorage.getItem( 'token' ) );
            },
            data: show
        } )
        .then( result => {
            const opts = {
                success: result.success,
                action: 'removido',
                show: result.show,
                nextFn: removeFn
            }

            handleResponse( opts );

            loading( false );
        } );
}

function handleResponse( _opts ) {
    const opts = _opts || {};
    const success = opts.success || false;
    const action = opts.action || '';
    const show = opts.show || {};
    const callNextFn = opts.nextFn || function() {};

    if ( success ) {
        swal( {
            type: "success",
            title: "Sucesso!",
            text: "Evento foi " + action + ".",
            timer: 1500,
            showConfirmButton: false
        } );
        callNextFn( show );
    } else {
        swal( {
            type: "error",
            title: "Erro!",
            text: "Não foi possível " + action + " o evento. Tente novamente ou deslogue e insira novamente suas credenciais.",
            timer: 1500,
            showConfirmButton: false
        } );
    }
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