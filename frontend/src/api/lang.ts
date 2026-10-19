export const apiTranslations = {
    ru: {
        requestFailed: 'Не удалось выполнить запрос', currentPassword: 'Неверный текущий пароль',
        samePassword: 'Новый пароль совпадает с текущим', changePassword: 'Не удалось изменить пароль',
        sendCode: 'Не удалось отправить код', invalidCode: 'Неверный код', emailMismatch: 'Email не совпадает',
        changeEmail: 'Не удалось изменить email', invalidPassword: 'Неверный пароль', checkout: 'Не удалось оформить заказ',
        loadOptions: 'Не удалось загрузить справочник', saveChanges: 'Не удалось сохранить изменения',
        deleteRecord: 'Не удалось удалить запись', seedOptions: 'Не удалось заполнить справочник',
        loadPlans: 'Не удалось загрузить тарифы', paymentLink: 'Некорректная ссылка на оплату',
        openPayment: 'Не удалось открыть оплату', cancelSubscription: 'Не удалось отменить подписку',
        verifyPayment: 'Не удалось проверить оплату',
    },
    en: {
        requestFailed: 'Could not complete the request', currentPassword: 'The current password is incorrect',
        samePassword: 'The new password is the same as the current password', changePassword: 'Could not change the password',
        sendCode: 'Could not send the code', invalidCode: 'Invalid code', emailMismatch: 'The email address does not match',
        changeEmail: 'Could not change the email address', invalidPassword: 'Incorrect password', checkout: 'Could not place the order',
        loadOptions: 'Could not load the reference data', saveChanges: 'Could not save changes',
        deleteRecord: 'Could not delete the record', seedOptions: 'Could not populate the reference data',
        loadPlans: 'Could not load subscription plans', paymentLink: 'Invalid payment link',
        openPayment: 'Could not open the payment page', cancelSubscription: 'Could not cancel the subscription',
        verifyPayment: 'Could not verify the payment',
    },
    zh: {
        requestFailed: '无法完成请求', currentPassword: '当前密码不正确',
        samePassword: '新密码与当前密码相同', changePassword: '无法修改密码',
        sendCode: '无法发送验证码', invalidCode: '验证码不正确', emailMismatch: '邮箱地址不匹配',
        changeEmail: '无法修改邮箱地址', invalidPassword: '密码不正确', checkout: '无法提交订单',
        loadOptions: '无法加载参考数据', saveChanges: '无法保存更改',
        deleteRecord: '无法删除记录', seedOptions: '无法填充参考数据',
        loadPlans: '无法加载订阅方案', paymentLink: '付款链接无效',
        openPayment: '无法打开付款页面', cancelSubscription: '无法取消订阅',
        verifyPayment: '无法验证付款',
    },
};

export const apiErrorText = (key: keyof typeof apiTranslations.ru): string => {
    const saved = typeof localStorage === 'undefined' ? 'ru' : localStorage.getItem('language');
    return apiTranslations[saved === 'en' || saved === 'zh' ? saved : 'ru'][key];
};
