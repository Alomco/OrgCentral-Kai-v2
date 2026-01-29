export function NotificationSettingsTypeHelp(props: { id: string; text: string }) {
    return (
        <p id={props.id} className="text-xs text-muted-foreground">
            {props.text}
        </p>
    );
}
