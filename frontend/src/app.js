import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import ko from 'knockout';
// import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import Router from 'ko-component-router';

import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import styles from '../styles/main.css';

import * as login_template from '../views/login';

const loading = ko.observable(true);

Router.use( loadingMiddleware );
Router.use( ( ctx ) => {
    const isLoginPage = ctx.path === '/login';
    const isHomePage = ctx.path === '/';
    const isLoggedIn = sessionStorage.getItem( 'authenticated' );

    if ( !isLoggedIn && !isLoginPage ) {
        ctx.redirect( '/login' );
    } else if ( isLoggedIn && isLoginPage ) {
        ctx.redirect( '/shows' );
    }
} );

Router.useRoutes( {
        '/': 'home',
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
                    sessionStorage.setItem( 'authenticated', true );
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
            this.shows = ctx.shows;
        }

        navigateToShow( show ) {
            Router.update( '/shows/' + show._id, { with: { show } } );
        }
    },
    template: `
               <ul data-bind="foreach: shows">
                  <li data-bind="text: name, click: $parent.navigateToShow"></li>
               </ul>
              `
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


function loadingMiddleware( ctx ) {
    return {
        beforeRender() {
            loading( true );
        },
        afterRender() {
            loading( false );
        }
    }
}

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
                console.log( result )
                if ( result.success ) {
                    localCtx.authenticated( true );
                } else {
                    localCtx.errorMessage( result.message );
                }
            },
            error: ( result ) => {
            }
        } )
    }
}

const main = () => {
    ko.applyBindings( { loading } );
}

$( document ).ready( () => main() );