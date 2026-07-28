import { expectType, expectAssignable } from 'tsd';
import { VError } from '../lib';

expectType<VError>(new VError());
expectType<VError>(new VError.PError());
expectType<VError>(new VError.SError());
expectType<VError>(new VError.WError());
expectType<VError.MultiError>(new VError.MultiError([new Error()]));
expectAssignable<VError.Options['cause']>(new Error());

const error = new VError(
    {
        name: 'RefusedConnect',
        info: {
            errno: 'ECONNREFUSED',
            remote_ip: '127.0.0.1',
            port: 215
        }
    },
    'failed to connect'
);
expectType<Error | null>(VError.cause(error));
expectType<VError.Info>(VError.info(error));
expectType<string>(VError.fullStack(error));
expectType<Error | null>(VError.findCauseByName(error, 'RefusedConnect'));
expectType<boolean>(VError.hasCauseWithName(error, 'RefusedConnect'));
expectType<VError | VError.MultiError | null>(VError.errorFromList([error]));
expectType<void>(VError.errorForEach(error, () => {}));
