import notFoundImage from '@/assets/errors/not_found.webp';
import {
    ErrorPageLayout,
    ErrorIllustration,
    ErrorContent,
    ErrorActions,
    ErrorLinkButton,
} from '@/components/error';

export const metadata = {
    title: 'Page not found | OrgCentral',
};

export default function NotFound() {
    return (
        <ErrorPageLayout intent="info">
            <ErrorIllustration src={notFoundImage} alt="Page not found" />
            <ErrorContent
                title="Page not found"
                description="The page you're looking for doesn't exist or you don't have access."
                intent="info"
            />
            <ErrorActions>
                <ErrorLinkButton href="/" variant="primary">
                    Go home
                </ErrorLinkButton>
                <ErrorLinkButton href="/login">Login</ErrorLinkButton>
            </ErrorActions>
        </ErrorPageLayout>
    );
}
