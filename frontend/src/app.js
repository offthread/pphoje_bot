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
            this.shows = ctx.shows.map( ( show ) => {
                show.date = moment( show.date ).format('DD/MM/YYYY');
                return show;
            });
            this.show = ko.observable( null );
            this.showSelectedShow = function( show ) {
                self.show( show );
                $( '#showModal' ).modal( 'show' );
            }
        }

        logout() {
            sessionStorage.removeItem( 'authenticated' );
            Router.update( '/' );
        }

        editShowSubmit( ) {
            const modal = $( '#showModal' );
            const modalNewName = $( '.modal-form #name' ).val();
            const modalNewVideoUrl = $( '.modal-form #videoUrl' ).val();
            const modalNewImgUrl = $( '.modal-form #imgUrl' ).val();
            const modalNewDate = $( '.modal-form #date' ).val();
            $( '#showModal' ).modal( 'hide' );
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

function checkCredentials( ctx ) {
    if ( sessionStorage.getItem( 'authenticated' ) ) {
        ctx.redirect( '//shows' );
    }
}

const main = () => {
    ko.applyBindings( { loading } );
}

$( document ).ready( () => main() );