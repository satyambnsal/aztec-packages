use crate::transaction::tx_context::TxContext;
use crate::header::Header;
use crate::traits::Empty;
use crate::abis::global_variables::GlobalVariables;

struct CombinedConstantData {
    historical_header: Header,
    // Note: `chain_id` and `version` in tx_context are not redundant to the values in
    // self.historical_header.global_variables because they can be different in case of a protocol upgrade. In such
    // a situation we could be using header from a block before the upgrade took place but be using the updated
    // protocol to execute and prove the transaction.
    tx_context: TxContext,

    global_variables: GlobalVariables,
}

impl CombinedConstantData {
    pub fn private(historical_header: Header, tx_context: TxContext) -> CombinedConstantData {
        CombinedConstantData { historical_header, tx_context, global_variables: GlobalVariables::empty() }
    }
}

impl Empty for CombinedConstantData {
    fn empty() -> Self {
        CombinedConstantData {
            historical_header: Header::empty(),
            tx_context: TxContext::empty(),
            global_variables: GlobalVariables::empty()
        }
    }
}
