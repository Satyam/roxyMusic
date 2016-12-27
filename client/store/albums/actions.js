import restAPI from '_platform/restAPI';
import asyncActionCreator from '_utils/asyncActionCreator';

const NAME = 'albums';
const api = restAPI(NAME);

export const GET_ALBUMS = `${NAME}/ get albums`;
export const GET_MORE_ALBUMS = `${NAME}/ get more albums`;
export const GET_ALBUM = `${NAME}/ get album`;

export function getAlbums(search) {
  return asyncActionCreator(
    GET_ALBUMS,
    api.read(search ? `?search=${search}` : ''),
    { search }
  );
}

export function getMoreAlbums(search, offset) {
  return asyncActionCreator(
    GET_MORE_ALBUMS,
    api.read(`?search=${search}&offset=${offset}`),
    { search, offset }
  );
}

export function getAlbum(idAlbum) {
  return asyncActionCreator(
    GET_ALBUM,
    api.read(idAlbum),
    { idAlbum }
  );
}
