import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import ko from 'knockout';
// import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import Router from 'ko-component-router';

import ShowsModel from './models/shows';

const loading = ko.observable(true);

Router.use( loadingMiddleware );

Router.useRoutes(
    {
        '/': 'home',
        '/shows': [loadShows.then( ( shows ) => console.log( shows ) ), 'shows']
    }
);

ko.components.register('home', {
    template: `<a data-bind="path: '/shows'">Show users</a>`
});

ko.components.register('shows', {
    viewModel: ShowsModel,
    template: `<a data-bind="path: '/shows'">Show users</a>`
});


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

function loadShows(ctx) {
  // return promise for async middleware
  return $.get('http://localhost:3000/api/shows').then( ( data ) => {
        ctx.shows = data;
    } );
}

const main = () => {
    ko.applyBindings( { loading } );
}

$(document).ready( () => main() );