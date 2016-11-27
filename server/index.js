import albums from './albums';
import playlists from './playlists';
import artists from './artists';
import songs from './songs';
import tracks from './tracks';
import refreshDb from './refreshDb';

import config from './config';

export default function (db, addToDataRouter) {
  // This one needs to be done before the rest
  return config(db).then(routes => addToDataRouter('/config', routes))
  .then(() => Promise.all([
    albums(db).then(routes => addToDataRouter('/albums', routes)),
    playlists(db).then(routes => addToDataRouter('/playLists', routes)),
    artists(db).then(routes => addToDataRouter('/artists', routes)),
    songs(db).then(routes => addToDataRouter('/songs', routes)),
    tracks(db).then(routes => addToDataRouter('/tracks', routes)),
    refreshDb(db).then(routes => addToDataRouter('/refreshDb', routes)),
  ]));
}
