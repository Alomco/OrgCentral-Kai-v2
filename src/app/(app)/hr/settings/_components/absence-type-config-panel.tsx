import type { RepositoryAuthorizationContext } from '@/server/repositories/security';
import { listAbsenceTypeConfigsForUi } from '@/server/use-cases/hr/absences/list-absence-type-configs.cached';

import { AbsenceTypeConfigForm } from './absence-type-config-form';

export async function AbsenceTypeConfigPanel(props: {
    authorization: RepositoryAuthorizationContext;
}) {
    const { types } = await listAbsenceTypeConfigsForUi({
        authorization: props.authorization,
        includeInactive: true,
    });

    return <AbsenceTypeConfigForm types={types} />;
}
