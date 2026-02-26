import { makeApiCall, taskEndpoints } from '@/app/api/config/endpoints';

export const taskService = {
    create: async (data: any) => {
        return await makeApiCall(taskEndpoints.create(), {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    getAll: async (params?: any) => {
        return await makeApiCall(taskEndpoints.getAll(params));
    },
    getMyTasks: async () => {
        return await makeApiCall(taskEndpoints.getMyTasks());
    },
    updateStatus: async (id: string, status: number) => {
        return await makeApiCall(taskEndpoints.updateStatus(id), {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },
    delete: async (id: string) => {
        return await makeApiCall(taskEndpoints.delete(id), {
            method: 'DELETE',
        });
    },
};
