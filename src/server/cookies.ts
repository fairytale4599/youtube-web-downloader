import Cookies from 'js-cookie'


export function saveKey(apiKey: string) {
    if (apiKey) {
        Cookies.set('apiKey', apiKey, { expires: 7 }) 
    } else {
        return false
    }
}

export function getKey() {
    return Cookies.get('apiKey')
}

export function deleteKey() {
    Cookies.remove('apiKey')
}

