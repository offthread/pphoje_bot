import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import ko from 'knockout';
// import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
import Router from 'ko-component-router';

const loading = ko.observable(true);

Router.use( loadingMiddleware );

Router.useRoutes( {
        '/': 'home',
        '/shows': {
            '/': [loadShows, 'shows'],
            '/:id': [loadShow, 'show']
        }
    }
);

ko.components.register('home', {
    template: `<a data-bind="path: '/shows'">Shows</a>`
});

ko.components.register('shows', {
    viewModel: class ShowsViewModel {
        constructor(ctx) {
            this.shows = ctx.shows;
        }

        navigateToShow(show) {
            Router.update('/shows/' + show._id, { with: { show } })
        }
    },
    template: `<ul data-bind="foreach: shows">
                  <li data-bind="text: name, click: $parent.navigateToShow"></li>
               </ul>
              `
});

ko.components.register('show', {
    viewModel: class ShowViewModel {
        constructor(ctx) {
            this.show = ctx.show;
            console.log(this.show);
        }
    },
    template: ` <div data-bind="with: show">
                <span data-bind="text: name"></span>
                <a target="_blank" data-bind="attr: { href: link }">Link</a>
                </div>
              `
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
    if (!ctx.shows) {
      return $.ajax('http://192.168.0.106:3000/api/shows')
        .then( ( result ) => ctx.shows = result )
    }
}

function loadShow(ctx) {
    if (!ctx.show) {
        return $.ajax('http://192.168.0.106:3000/api/shows')
        .then( ( result ) => _.filter( ctx.shows, ( show ) => show._id == ctx.params.id ) );
    }
}

const main = () => {
    ko.applyBindings( { loading } );
}

$(document).ready( () => main() );