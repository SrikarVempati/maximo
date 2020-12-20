/*

#==============================================================================
#*   NAME: TCKIVOVARIANCE
#* 
#*   PURPOSE: Script to calculate Invoice Variances
#*
#*   REVISIONS:
#*   Ver        Date              Author                             Description
#*   ---------  ---------- ---  ---------- ---------------  -----------------------------------
#*	 1.0												Variance calculations   
#*	 2.0		17-Dec-2020		Sai/Atul				MX02L - Updated the script with new logic based on invoicedate 
#*   
#*
#*
#***************************** End Standard Header ****************************
#==============================================================================

*/
//TCKIVOVARIANCE - called from wfction of ivo wf
load("nashorn:mozilla_compat.js");
importPackage(Packages.psdi.util);
importPackage(Packages.psdi.server);
importPackage(Packages.psdi.mbo);
importPackage(Packages.psdi.mbo.MboConstants);
importPackage(Packages.psdi.util.logging.MXLoggerFactory);
importPackage(Packages.psdi.security.UserInfo);
importPackage(Packages.java.math.BigDecimal);
importPackage(Packages.java.rmi.RemoteException);
importPackage(Packages.java.util.Date);
importPackage(Packages.java.util.Enumeration);
importPackage(Packages.java.util.Hashtable);
importPackage(Packages.java.util.Vector);
importPackage(Packages.psdi.app.common.Cost);
importPackage(Packages.psdi.app.common.RoundToScale);
importPackage(Packages.psdi.app.common.TaxUtility);
importPackage(Packages.psdi.app.common.receipt.ReceiptMbo);
importPackage(Packages.psdi.app.common.receipt.ReceiptMboRemote);
importPackage(Packages.psdi.app.company.CompanySetRemote);
importPackage(Packages.psdi.app.currency.CurrencyService);
importPackage(Packages.psdi.app.currency.CurrencyServiceRemote);
importPackage(Packages.psdi.app.integration.IntegrationServiceRemote);
importPackage(Packages.psdi.app.inventory.InventoryRemote);
importPackage(Packages.psdi.app.inventory.MatRecTransRemote);
importPackage(Packages.psdi.app.labor.ServRecTransRemote);
importPackage(Packages.psdi.app.po.POLineRemote);
importPackage(Packages.psdi.app.po.PORemote);
importPackage(Packages.psdi.app.invoice.InvoiceLineSet);
importPackage(Packages.psdi.app.invoice.InvoiceLineSetRemote);
importPackage(Packages.psdi.app.invoice.InvoiceLine);
importPackage(Packages.psdi.app.invoice.InvoiceLineRemote);
importPackage(Packages.psdi.app.workorder.WORemote);
importPackage(Packages.psdi.mbo.Mbo);
importPackage(Packages.psdi.mbo.MboRemote);
importPackage(Packages.psdi.mbo.MboSet);
importPackage(Packages.psdi.mbo.MboSetRemote);
importPackage(Packages.psdi.mbo.MboValue);
importPackage(Packages.psdi.mbo.MboValueInfo);
importPackage(Packages.psdi.mbo.SqlFormat);
importPackage(Packages.psdi.security.UserInfo);
importPackage(Packages.psdi.server.AppService);
importPackage(Packages.psdi.server.MXServer);
importPackage(Packages.psdi.util.MXApplicationException);
importPackage(Packages.psdi.util.MXException);
importPackage(Packages.psdi.util.MXFormat);
importPackage(Packages.psdi.util.MXMath);

//SV - MX02L - Added exchRateMT global var
exchRateMT = mbo.getDouble("exchangerate"); //sv - just initializing the global variable with exchangerate. 
currService = MXServer.getMXServer().lookup("CURRENCY")

function getInternalInvDocType(paramMbo) {
    return paramMbo.getTranslator().toInternalString("INVTYPE", paramMbo.getString("documenttype"));
}

function getTaxDiffSign(paramMbo) {
    rtaxdiffsign = +1.0;
    //invdoctype = getInternalInvDocType(paramMbo);
    //if (invdoctype.equalsIgnoreCase("CREDIT") || invdoctype.equalsIgnoreCase("REVCREDIT") ){
    ////    rtaxdiffsign = -1.0;
    //}
    //else {
    //    rtaxdiffsign = +1.0;
    //}
    return rtaxdiffsign;
}

function getTaxTypeCode(paramTaxCode, paramOrgId) {
    objname = "TAX";
    taxset = MXServer.getMXServer().getMboSet(objname, MXServer.getMXServer().getUserInfo('MAXADMIN'));
	
    taxset.setWhere("TAXCODE = '" + paramTaxCode +"' and ORGID = '" + paramOrgId + "'");
    //taxset.reset();
    tax = taxset.moveFirst();
    if (tax == null) {
        return "-1";
    }
    else {
        return tax.getString("TYPECODE");
    }
}

function getTotalTaxArray(pinvoicembo, pnumberoftaxes)
{
	taxarray = []
    a1 = 1;
    while (a1 <= pnumberoftaxes)
	{
        totaltax = pinvoicembo.getDouble("TOTALTAX"+a1.toString());
		//totaltax = float(totaltax);
        taxarray.push((totaltax));
		a1 = a1 + 1;
		
	}
	return taxarray;
}

function calculateTaxComponentToBeAdded(pinvoicembo,pinvoiceline, pdtetaxcode, pdtetaxtypecode, ptotaltaxdiff, paccumulatedtaxdelta) 
{

    taxcomponenttobeadded = 0.0;
    ivolineid = pinvoiceline.getLong("INVOICELINEID");
    ivolinenum = pinvoiceline.getInt("INVOICELINENUM");
    ivolineset = pinvoicembo.getMboSet("INVOICELINE");
    ivolinecostsum = 0.0;
    i = 0;
	while(i<ivolineset.count()) 
	{
        ivoline = ivolineset.getMbo(i);
        if (ivoline.getDouble("LINECOST") != 0.0 && (! ivoline.isNull("TAX"+dtetaxtypecode+"CODE")) && ivoline.getString("TAX"+dtetaxtypecode+"CODE") == pdtetaxcode.toString() && (ivolineid <= ivoline.getLong("INVOICELINEID")))
		{	
            ivolinecostsum = ivolinecostsum + ivoline.getDouble("LINECOST");
		}	
        i = i + 1;
	}	
    ivolinecost = pinvoiceline.getDouble("LINECOST");
    if (ivolinecost == ivolinecostsum)
	{
        taxcomponenttobeadded = ptotaltaxdiff - paccumulatedtaxdelta;
        //mbo.setValue("DESCRIPTION", mbo.getString("DESCRIPTION")+ "c1-" +str(taxcomponenttobeadded)+"-"+str(ivolinenum)+"-"+str(paccumulatedtaxdelta)+"-"+str(pdtetaxtypecode)+"-"+str(ivolinecostsum))
	}	
    else 
	{
        taxcomponenttobeadded = Math.round( MXMath.multiply( (MXMath.subtract(ptotaltaxdiff, paccumulatedtaxdelta)), (MXMath.divide(ivolinecost, ivolinecostsum)) ) );
        //mbo.setValue("DESCRIPTION", mbo.getString("DESCRIPTION")+ "c2-" +str(taxcomponenttobeadded)+"-"+str(ivolinenum)+"-"+str(paccumulatedtaxdelta)+"-"+str(pdtetaxtypecode)+"-"+str(ivolinecostsum))
	}	
    return taxcomponenttobeadded;
}

function getInternalLineType(paramMbo) {
    return paramMbo.getTranslator().toInternalString("LINETYPE", paramMbo.getString("linetype"));
}

function isServiceType(paramMbo) {
    maxLineType = getInternalLineType(paramMbo);
    if (maxLineType.equalsIgnoreCase("SERVICE") || maxLineType.equalsIgnoreCase("STDSERVICE"))
        return true;
    return false;
}

function getTaxDiff(paramInvoiceLine, paramTaxCodeIds) { // depricated
    taxVar = 0.0;
    invTaxTotal = 0.0;
    receiptTaxTotal = 0.0;
    taxNum = paramTaxCodeIds.length;
    invoice = paramInvoiceLine.getOwner();
    invExchRate = invoice.getDouble("exchangerate");
    for (z1 = 1; (z1 < taxNum + 1 && (paramTaxCodeIds.indexOf(String(z1)) != -1)); z1++) {
        if (paramInvoiceLine.getDouble("tax" + z1) != 0.0 && !paramInvoiceLine.isNull("tax" + z1)) {
            invTaxTotal = invTaxTotal + paramInvoiceLine.getDouble("tax" + z1)
        }
    }
    matchSet = paramInvoiceLine.getInvoiceMatchSet();
    match = null;
    for (i = 0; (match = matchSet.getMbo(i)) != null; i++) {
        if (!match.toBeDeleted() && match.getDouble("QUANTITY") != 0.0) {
            matchTaxTotal = 0.0;
            receiptMboRemote = null;
            receiptMboRemote = match.getReceipt();
            for (y1 = 1; (y1 < taxNum + 1 && (paramTaxCodeIds.indexOf(String(y1)) != -1)); y1++) {
                if (receiptMboRemote.getDouble("tax" + y1) != 0.0 && !receiptMboRemote.isNull("tax" + y1)) {
                    matchTaxTotal = matchTaxTotal + receiptMboRemote.getDouble("tax" + y1)
                }
            }
            receiptTaxTotal = MXMath.add(receiptTaxTotal, matchTaxTotal);
        }
    }
    if (receiptTaxTotal == 0.0) {
        taxVar = invTaxTotal;
    }
    else {
        taxVar = MXMath.subtract(invTaxTotal, MXMath.divide(receiptTaxTotal, invExchRate));
    }
    return taxVar;
}

function calculateCurVarTotal(paramInvoiceLine) {
    curVar = 0.0;
	
    po = ((paramInvoiceLine.getThisMboSet())).getPOForQueryOnly(paramInvoiceLine.getString("ponum"), paramInvoiceLine.getString("positeid"), paramInvoiceLine.getString("porevisionnum"));
    if (po == null) {
        po = paramInvoiceLine.getMboSet("PO").getMbo(0);
        if (po != null)
            ((paramInvoiceLine.getThisMboSet())).setPOforQueryOnly(po);
    }

    invoice = paramInvoiceLine.getOwner();
    invLineOrigLoadedCost = paramInvoiceLine.getDouble("TCKORIGLOADEDCOST");
    po_Curr = po.getString("currencycode");
    invoice_Curr = invoice.getString("currencycode");
    //base_Curr = currService.getBaseCurrency1(po.getString("ORGID"), MXServer.getMXServer().getUserInfo(user));
    
	
	//------------------exchange rate  logic start----
	if (invoice.getDate("INVOICEDATE") != null) {
        invoiceDate = invoice.getDate("INVOICEDATE");
    }
    else {
        invoiceDate = MXServer.getMXServer().getDate();
    }
	
    exchRateInv_Org = invoice.getDouble("exchangerate");
	//sv - if invoice currency is same as po currency
    if (invoice_Curr == po_Curr) {
        exchRateInv_PO = 1;
    }
    else { //sv - if invoice currency is NOT same as po currency
        
        exchRateInv_PO = currService.getCurrencyExchangeRate(MXServer.getMXServer().getUserInfo(user), invoice_Curr, po_Curr, invoiceDate, po.getString("ORGID"));
    }
	
    if (true) {
        matchSet = paramInvoiceLine.getInvoiceMatchSet();
        match = null;
        for (i = 0; (match = (matchSet.getMbo(i))) != null; i++) {
            if (!match.toBeDeleted() && match.getDouble("QUANTITY") != 0.0) {

                lineVar = 0.0;
                if (isServiceType(paramInvoiceLine)) {
                    receiptMboRemote = match.getReceipt();
                    exchRatePO_Org = receiptMboRemote.getDouble("exchangerate")
                    lineVar = (invLineOrigLoadedCost * exchRateInv_Org) - ((invLineOrigLoadedCost * exchRateInv_PO) * exchRatePO_Org);
                }
                else {
                    receiptMboRemote = match.getReceipt();
                    exchRatePO_Org = receiptMboRemote.getDouble("exchangerate")
                    lineVar = (invLineOrigLoadedCost * exchRateInv_Org) - ((invLineOrigLoadedCost * exchRateInv_PO) * exchRatePO_Org);
                }
                curVar = MXMath.add(curVar, lineVar);
            }
        }
    }
	
    else {
        curVar = 0.0;
    }
    if (curVar != 0.0)
        curVar = MXMath.divide(curVar, exchRateInv_Org);
    return curVar;
}



function calculatePriceVarTotal(paramInvoiceLine) {
    priceVar = 0.0; //sv - price variance of invoiceline
    totalVar = 0.0;//sv - total variance of all match lines
    invoice = paramInvoiceLine.getOwner();
	
    exchRateInv_Org = invoice.getDouble("exchangerate");
	
	matchSet = paramInvoiceLine.getInvoiceMatchSet();
    match = null;
    for (i = 0; (match = matchSet.getMbo(i)) != null; i++) {
        if (!match.toBeDeleted() && match.getDouble("QUANTITY") != 0.0) {
            matchQuantity = match.getDouble("quantity");
            invLineQty = paramInvoiceLine.getDouble("invoiceqty");
            matchLinecost = 0.0;
            if (invLineQty != 0.0) {
                matchLinecost = matchQuantity * paramInvoiceLine.getDouble("loadedcost") / invLineQty; //loadedcost
            }
            else {
                matchLinecost = match.getDouble("loadedcost"); //sv - loadedcost is not available in invoicematch table??
            }
            matchConversion = (match.isNull("conversion") || match.getDouble("conversion") == 0.0) ? 1.0 : match.getDouble("conversion");
            lineVar = 0.0; //sv - match lines -  linevar
            receiptMboRemote = null;
			//sv - service and standardservice receipts
            if (isServiceType(paramInvoiceLine)) {
                if (invLineQty != 0.0) {
                    receiptMboRemote1 = match.getReceipt();
                    receiptLinecost = receiptMboRemote1.getDouble("loadedcost"); //loadedost
                    receiptQuantity = receiptMboRemote1.getDouble("quantity");
                    exchRatePO_Org = 1.0; //receiptMboRemote1.getDouble("exchangerate");
                    if (receiptQuantity != null && receiptQuantity != 0.0) {
                       
					    lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org), MXMath.multiply(MXMath.multiply(
                            receiptLinecost,
                            MXMath.multiply(matchQuantity, MXMath.divide(matchConversion, receiptQuantity))), exchRatePO_Org));
						
						
						
                    }
                    else {
                        lineVar = 0.00;
                    }

                }
                else {
                    receiptMboRemote1 = match.getReceipt();
                    receiptLinecost = receiptMboRemote1.getDouble("linecost");
                    exchRatePO_Org = 1.0; //receiptMboRemote1.getDouble("exchangerate");
                    lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org),
                        MXMath.multiply(exchRatePO_Org, MXMath.multiply(receiptLinecost,
                            MXMath.divide(matchLinecost, receiptMboRemote1.getDouble("currencylinecost")))));
                }
            }
			
			//sv - for material receipts
            else {
                receiptMboRemote = match.getReceipt();
                receiptLinecost = receiptMboRemote.getDouble("loadedcost");
                receiptQuantity = receiptMboRemote.getDouble("quantity");
                receiptConversion = receiptMboRemote.getDouble("conversion");
                exchRatePO_Org = 1.0; //receiptMboRemote.getDouble("exchangerate");

                if (receiptQuantity != null && receiptQuantity != 0.0) {

                    if (matchConversion != 1.0 && receiptConversion == matchConversion) {
                        bdValue1 = (MXMath.multiply(matchQuantity, MXMath.divide(matchConversion, receiptQuantity)));
                        conversion = bdValue1;
                        if (conversion == 1.0) {
                            lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org),
                                MXMath.multiply(MXMath.multiply(receiptLinecost, conversion), exchRatePO_Org));
                        }
                        else {
                            lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org), MXMath.multiply(MXMath.multiply(
                                receiptLinecost,
                                MXMath.multiply(matchQuantity, MXMath.divide(matchConversion, receiptQuantity))), exchRatePO_Org));
                        }
                    }
                    else {
                        lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org), MXMath.multiply(MXMath.multiply(
                            receiptLinecost,
                            MXMath.multiply(matchQuantity, MXMath.divide(matchConversion, receiptQuantity))), exchRatePO_Org));
                    }
                }
                else {
                    lineVar = 0.0;
                }
            }
            totalVar = MXMath.add(totalVar, lineVar); //sv - totalvar of all matching lines of an invoiceline = sum of linevar of each mathcing line
        }
    }
    if (paramInvoiceLine.getInvoiceMatchSet().count() == 0) {
        totalVar = MXMath.multiply(paramInvoiceLine.getDouble("loadedcost"), exchRateInv_Org);
    }
    curVar = calculateCurVarTotal(paramInvoiceLine); // sv - calculating curvar of all matching lines of an invoiceline
    if (totalVar != 0.0)
        totalVar = MXMath.divide(totalVar, exchRateInv_Org);
    if (curVar == 0.0) {
        priceVar = totalVar;
    }
    else {
		//sv - pricevar of all matching lines of an invoiceline = totalvar of all matching lines of an invoiceline - currvar of all matching lines of an invoiceline
        priceVar = MXMath.subtract(totalVar, curVar); 
		
    }
    return priceVar;
}


//sv - MX02L - Addded - New function calculateCurVarTotalMT created - to use the exchange rate between po_curr and invoice_curr at invoice.invoicedate for calculations

function calculateCurVarTotalMT(paramInvoiceLine) {
    curVar = 0.0;
    po = ((paramInvoiceLine.getThisMboSet())).getPOForQueryOnly(paramInvoiceLine.getString("ponum"), paramInvoiceLine.getString("positeid"), paramInvoiceLine.getString("porevisionnum"));
    if (po == null) {
        po = paramInvoiceLine.getMboSet("PO").getMbo(0);
        if (po != null)
            ((paramInvoiceLine.getThisMboSet())).setPOforQueryOnly(po);
    }

    invoice = paramInvoiceLine.getOwner();
    invLineOrigLoadedCost = paramInvoiceLine.getDouble("TCKORIGLOADEDCOST");
    po_Curr = po.getString("currencycode");
    invoice_Curr = invoice.getString("currencycode");
    //base_Curr = currService.getBaseCurrency1(po.getString("ORGID"), MXServer.getMXServer().getUserInfo(user));
    
	
	//------------------exchange rate  logic start----
	if (invoice.getDate("INVOICEDATE") != null) {
        invoiceDate = invoice.getDate("INVOICEDATE");
    }
    else {
        invoiceDate = MXServer.getMXServer().getDate();
    }
	//sv - exchRateInv_Org is INVOICE.EXCHANGERATE - after disabling the prop it will calculate based on current date
    
	//exchRateInv_Org = invoice.getDouble("exchangerate"); //sv - invoice curreny to organizaiton currency
	//SV - MX02L - COMMENTED above line - Added two new lines below to calculate exchange rate based on invoice.invoicedate
	org_base_curr = currService.getBaseCurrency1(po.getString("ORGID"), MXServer.getMXServer().getUserInfo(user));
	exchRateInv_Org = currService.getCurrencyExchangeRate(MXServer.getMXServer().getUserInfo(user), invoice_Curr, org_base_curr,  invoiceDate, po.getString("ORGID"));
	exchRateMT = exchRateInv_Org; //SV - set exchRateInv_Org to global variable
	
	//SV - MX02L - END
	
	//sv - if invoice currency is same as po currency  THEN exchRateInv_PO = 1
	
    if (invoice_Curr == po_Curr) {
        exchRateInv_PO = 1;
    }
    else { //sv - if invoice currency is NOT same as po currency then exchRateInv_PO = (exchangerate between clp-usd)
        
        exchRateInv_PO = currService.getCurrencyExchangeRate(MXServer.getMXServer().getUserInfo(user), invoice_Curr, po_Curr, invoiceDate, po.getString("ORGID"));
    }
	
    if (true) {
        matchSet = paramInvoiceLine.getInvoiceMatchSet();
        match = null;
        for (i = 0; (match = (matchSet.getMbo(i))) != null; i++) {
            if (!match.toBeDeleted() && match.getDouble("QUANTITY") != 0.0) {

                lineVar = 0.0;
                if (isServiceType(paramInvoiceLine)) {
                    receiptMboRemote = match.getReceipt();
                    exchRatePO_Org = receiptMboRemote.getDouble("exchangerate") //sv - this is the Exchange rate at receipt date 
                    lineVar = (invLineOrigLoadedCost * exchRateInv_Org) - ((invLineOrigLoadedCost * exchRateInv_PO) * exchRatePO_Org);
                }
                else {
                    receiptMboRemote = match.getReceipt();
                    exchRatePO_Org = receiptMboRemote.getDouble("exchangerate")
                    lineVar = (invLineOrigLoadedCost * exchRateInv_Org) - ((invLineOrigLoadedCost * exchRateInv_PO) * exchRatePO_Org);
                }
                curVar = MXMath.add(curVar, lineVar);
            }
        }
    }
	
    else {
        curVar = 0.0;
    }
    if (curVar != 0.0) //Sv - ??????
        curVar = MXMath.divide(curVar, exchRateInv_Org);
    return curVar;
}


//SV - MX02L - Added - New function calculatePriceVarTotalMT  created - to use the exchange rate between po_curr and invoice_curr at invoice.invoicedate for calculations 

function calculatePriceVarTotalMT(paramInvoiceLine) {
    priceVar = 0.0; //sv - price variance of invoiceline
    totalVar = 0.0;//sv - total variance of all match lines
    invoice = paramInvoiceLine.getOwner();
	
	//exchRateInv_Org = invoice.getDouble("exchangerate");
	//SV - MX02L - COMMENTED above line - Added new lines below to calculate exchange rate between po_curr and invoice_curr based on invoice.invoicedate
	
	if (invoice.getDate("INVOICEDATE") != null) {
        invoiceDate = invoice.getDate("INVOICEDATE");
    }
    else {
        invoiceDate = MXServer.getMXServer().getDate();
    }
	po = ((paramInvoiceLine.getThisMboSet())).getPOForQueryOnly(paramInvoiceLine.getString("ponum"), paramInvoiceLine.getString("positeid"), paramInvoiceLine.getString("porevisionnum"));
    if (po == null) {
        po = paramInvoiceLine.getMboSet("PO").getMbo(0);
        if (po != null)
            ((paramInvoiceLine.getThisMboSet())).setPOforQueryOnly(po);
    }
	po_Curr = po.getString("currencycode");
	
	invoice = paramInvoiceLine.getOwner();
    invLineOrigLoadedCost = paramInvoiceLine.getDouble("TCKORIGLOADEDCOST");
    po_Curr = po.getString("currencycode");
    invoice_Curr = invoice.getString("currencycode");
	
	
	org_base_curr = currService.getBaseCurrency1(po.getString("ORGID"), MXServer.getMXServer().getUserInfo(user));
	exchRateInv_Org = currService.getCurrencyExchangeRate(MXServer.getMXServer().getUserInfo(user), invoice_Curr, org_base_curr,  invoiceDate, po.getString("ORGID"));
	exchRateMT = exchRateInv_Org; //SV - set exchRateInv_Org to global variable
	//SV - MX02L - END
	
	
	
    matchSet = paramInvoiceLine.getInvoiceMatchSet();
    match = null;
    for (i = 0; (match = matchSet.getMbo(i)) != null; i++) {
        if (!match.toBeDeleted() && match.getDouble("QUANTITY") != 0.0) {
            matchQuantity = match.getDouble("quantity");
            invLineQty = paramInvoiceLine.getDouble("invoiceqty");
            matchLinecost = 0.0;
            if (invLineQty != 0.0) {
                matchLinecost = matchQuantity * paramInvoiceLine.getDouble("loadedcost") / invLineQty; //sv - same as invoice loadedcost
            }
            else {
                matchLinecost = match.getDouble("loadedcost"); //SV - no loadedcost field in invoicematch table
            }
            matchConversion = (match.isNull("conversion") || match.getDouble("conversion") == 0.0) ? 1.0 : match.getDouble("conversion");
            lineVar = 0.0; //sv - match lines -  linevar
            receiptMboRemote = null;
			//sv - service and standardservice receipts
            if (isServiceType(paramInvoiceLine)) {
                if (invLineQty != 0.0) {
                    receiptMboRemote1 = match.getReceipt();
                    receiptLinecost = receiptMboRemote1.getDouble("loadedcost"); //loadedost
                    receiptQuantity = receiptMboRemote1.getDouble("quantity");
                    exchRatePO_Org = 1.0; //receiptMboRemote1.getDouble("exchangerate"); //SV - ???? why set to 1
                    if (receiptQuantity != null && receiptQuantity != 0.0) {
                       
					   
					    lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org), MXMath.multiply(MXMath.multiply(
                            receiptLinecost,
                            MXMath.multiply(matchQuantity, MXMath.divide(matchConversion, receiptQuantity))), exchRatePO_Org));
						
						
						
                    }
                    else {
                        lineVar = 0.00;
                    }

                }
                else {
                    receiptMboRemote1 = match.getReceipt();
                    receiptLinecost = receiptMboRemote1.getDouble("linecost");
                    exchRatePO_Org = 1.0; //receiptMboRemote1.getDouble("exchangerate");
                    lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org),
                        MXMath.multiply(exchRatePO_Org, MXMath.multiply(receiptLinecost,
                            MXMath.divide(matchLinecost, receiptMboRemote1.getDouble("currencylinecost")))));
                }
            }
			
			//sv - for material receipts
            else {
                receiptMboRemote = match.getReceipt();
                receiptLinecost = receiptMboRemote.getDouble("loadedcost");
                receiptQuantity = receiptMboRemote.getDouble("quantity");
                receiptConversion = receiptMboRemote.getDouble("conversion");
                exchRatePO_Org = 1.0; //receiptMboRemote.getDouble("exchangerate");

                if (receiptQuantity != null && receiptQuantity != 0.0) {

                    if (matchConversion != 1.0 && receiptConversion == matchConversion) {
                        bdValue1 = (MXMath.multiply(matchQuantity, MXMath.divide(matchConversion, receiptQuantity)));
                        conversion = bdValue1;
                        if (conversion == 1.0) {
                            lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org),
                                MXMath.multiply(MXMath.multiply(receiptLinecost, conversion), exchRatePO_Org));
                        }
                        else {
                            lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org), MXMath.multiply(MXMath.multiply(
                                receiptLinecost,
                                MXMath.multiply(matchQuantity, MXMath.divide(matchConversion, receiptQuantity))), exchRatePO_Org));
                        }
                    }
                    else {
                        lineVar = MXMath.subtract(MXMath.multiply(matchLinecost, exchRateInv_Org), MXMath.multiply(MXMath.multiply(
                            receiptLinecost,
                            MXMath.multiply(matchQuantity, MXMath.divide(matchConversion, receiptQuantity))), exchRatePO_Org));
                    }
                }
                else {
                    lineVar = 0.0;
                }
            }
            totalVar = MXMath.add(totalVar, lineVar); //sv - totalvar of all matching lines of an invoiceline = sum of linevar of each mathcing line
        }
    }
    if (paramInvoiceLine.getInvoiceMatchSet().count() == 0) {
        totalVar = MXMath.multiply(paramInvoiceLine.getDouble("loadedcost"), exchRateInv_Org);
    }
    curVar = calculateCurVarTotal(paramInvoiceLine); // sv - calculating curvar of all matching lines of an invoiceline
    if (totalVar != 0.0)
        totalVar = MXMath.divide(totalVar, exchRateInv_Org);
    if (curVar == 0.0) {
        priceVar = totalVar;
    }
    else {
		//sv - pricevar of all matching lines of an invoiceline = totalvar of all matching lines of an invoiceline - currvar of all matching lines of an invoiceline
        priceVar = MXMath.subtract(totalVar, curVar); 
		
    }
	

	return priceVar;
}





function calculateWarrantyCurVarTotal(paramInvoice) {
    curVar = 0.0;
    invoiceExchRate = 1.0;
    plustclaim = null;
    plustclaim = paramInvoice.getMboSet("TCKINVPLUSTCLAIM").moveFirst();
    if (plustclaim != null) {
        plustclaimcontr = plustclaim.getMboSet("PLUSTWARRANTYVIEW").moveFirst();
        if (plustclaim != null && plustclaimcontr != null) {
            invoiceExchRate = paramInvoice.getDouble("exchangerate");
            if (paramInvoice.getString("currencycode").equals(plustclaimcontr.getString("currencycode"))) {
                invoicePreTaxCost = MXMath.abs(paramInvoice.getDouble("pretaxtotal"));
                lineVar = 0.0;

                plustclaimExchRate = invoiceExchRate; //plustclaim.getDouble("tckexchangerate");
                //plustclaimExchRate = (plustclaimExchRate == 0.0 || plustclaimExchRate == null) ? 1.0 : MXMath.divide(1.0, plustclaimExchRate);

                plustclaimClaimCost = plustclaim.getDouble("claimedamt");
                lineVar = MXMath.subtract(MXMath.multiply(invoiceExchRate, invoicePreTaxCost), MXMath.multiply(plustclaimExchRate, invoicePreTaxCost));
                curVar = MXMath.add(curVar, lineVar);
            }
            else { curVar = 0.0 }
        }
        else { curVar = 0.0; }
    }
    if (curVar != 0.0)
        curVar = MXMath.divide(curVar, invoiceExchRate);
    return curVar;
}

function calculateWarrantyPriceVarTotal(paramInvoice) {
    priceVar = 0.0;
    totalVar = 0.0;
    curVar = 0.0;
    invoiceExchRate = 1.0;
    plustclaimExchRate = 1.0;
    plustclaim = null;
    plustclaim = paramInvoice.getMboSet("TCKINVPLUSTCLAIM").moveFirst();
    if (plustclaim != null) {
        plustclaimcontr = plustclaim.getMboSet("PLUSTWARRANTYVIEW").moveFirst();
        if (plustclaim != null && plustclaimcontr != null) {
            invoiceExchRate = paramInvoice.getDouble("exchangerate");

            plustclaimExchRate = 1.0; //plustclaim.getDouble("tckexchangerate");
            //plustclaimExchRate = (plustclaimExchRate == 0.0 || plustclaimExchRate == null) ? 1.0 : MXMath.divide(1.0, plustclaimExchRate);

            invoicePreTaxCost = MXMath.abs(paramInvoice.getDouble("pretaxtotal"));
            plustclaimClaimCost = plustclaim.getDouble("claimedamt");
            lineVar = 0.0;
            lineVar = MXMath.subtract(MXMath.multiply(invoiceExchRate, invoicePreTaxCost), MXMath.multiply(plustclaimExchRate, plustclaimClaimCost));
            totalVar = MXMath.add(totalVar, lineVar);
        }
    }
    curVar = calculateWarrantyCurVarTotal(paramInvoice);
    if (totalVar != 0.0)
        totalVar = MXMath.divide(totalVar, invoiceExchRate);
    if (curVar == 0.0) {
        priceVar = totalVar;
    } else {
        priceVar = MXMath.subtract(totalVar, curVar);
    }
    return priceVar;
    //return totalVar;
}

function getWarrantyTaxDiff(paramInvoiceLine, paramTaxCodeIds) {
    taxVar = 0.0;
    invTaxTotal = 0.0;
    receiptTaxTotal = 0.0;
    taxNum = paramTaxCodeIds.length;
    invoice = paramInvoiceLine.getOwner();
    invExchRate = invoice.getDouble("exchangerate");
    for (z1 = 1; (z1 < taxNum + 1 && (paramTaxCodeIds.indexOf(String(z1)) != -1)); z1++) {
        if (paramInvoiceLine.getDouble("tax" + z1) != 0.0 && !paramInvoiceLine.isNull("tax" + z1)) {
            invTaxTotal = invTaxTotal + paramInvoiceLine.getDouble("tax" + z1)
        }
    }
    taxVar = invTaxTotal;
    return taxVar;
}

function insertInvoiceTransRecord(invoiceline, invoiceCostMbo, transType, varianceAmt, varGLAcct, entrepval) {

    invoice_mbo = invoiceline.getOwner();
    exchangeRateInv_Org = invoice_mbo.getDouble("exchangerate");
    transSet = invoice_mbo.getMboSet("INVOICETRANS");
    transSet.setInsertSite(invoiceline.getString("SITEID"));
    transSet.setInsertOrg(invoiceline.getString("ORGID"));
    transMbo = transSet.add(MboConstants.NOACCESSCHECK);
    //throw new Error("Here2");

    transMbo.setValue("INVOICENUM", invoiceCostMbo.getString("INVOICENUM"), MboConstants.NOACCESSCHECK);
    transMbo.setValue("INVOICELINENUM", invoiceCostMbo.getInt("INVOICELINENUM"), MboConstants.NOACCESSCHECK);
    transMbo.setValue("COSTLINENUM", invoiceCostMbo.getInt("COSTLINENUM"), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
    transMbo.setValue("CURRENCYLINECOST", varianceAmt, MboConstants.NOACCESSCHECK);
    transMbo.setValue("VENDOR", invoiceCostMbo.getString("VENDOR"), MboConstants.NOACCESSCHECK);
    transMbo.setValue("GLDEBITACCT", varGLAcct, MboConstants.NOACCESSCHECK);
    transMbo.setValue("GLCREDITACCT", invoiceCostMbo.getString("GLCREDITACCT"), MboConstants.NOACCESSCHECK);
    transMbo.setValue("CURRENCYCODE", invoice_mbo.getString("CURRENCYCODE"));
    transMbo.setValue("TRANSTYPE", transType, MboConstants.NOACCESSCHECK);
    transMbo.setValue("ACTUALDATE", invoice_mbo.getDate("glpostdate"), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
    transMbo.setValue("ENTERBY", MXServer.getMXServer().getUserInfo(user).getPersonId(), MboConstants.NOACCESSCHECK);
    transMbo.setValue("EXCHANGERATE", exchangeRateInv_Org, MboConstants.NOACCESSCHECK);
    transMbo.setValue("LINECOST", (varianceAmt * exchangeRateInv_Org), MboConstants.NOACCESSCHECK);
    transMbo.setValue("TRANSDATE", MXServer.getMXServer().getDate(), MboConstants.NOACCESSCHECK);
    transMbo.setValue("FINANCIALPERIOD", invoice_mbo.getString("FINANCIALPERIOD"), MboConstants.NOACCESSCHECK);

    //ToDo - Non GL Components - Check Once
    if (entrepval != null) {
        transMbo.setValue("TCKENTREPORTING", entrepval.getString("TCKENTREPORTING"), MboConstants.NOACCESSCHECK);
        transMbo.setValue("TCKACTIVITY", entrepval.getString("TCKACTIVITY"), MboConstants.NOACCESSCHECK);
        transMbo.setValue("TCKRESPCENTER", entrepval.getString("TCKRESPCENTER"), MboConstants.NOACCESSCHECK);
    }
}










//===========================================================
//Start



invoicembo = mbo;
scale = invoicembo.getMboValue("BASETOTALCOST").getScale();
curVarTotal = 0.0;
priceVarTotal = 0.0;
taxVarTotal = 0.0;

//SV - MX02L - Added 2 MT fields below
curVarTotalMT = 0.0;
priceVarTotalMT = 0.0;

lineCurrVarMT = 0.0;
linePriceVarMT = 0.0;

objname = "ALNDOMAIN";
wfset = MXServer.getMXServer().getMboSet(objname, MXServer.getMXServer().getUserInfo('MAXADMIN'));
wfset.setWhere("domainid='TCKINVOICELIMITS' and value = 'SALESTAXCODEIDS'");
wfset.reset();

objname = "ORGANIZATION";
orgset = MXServer.getMXServer().getMboSet(objname, MXServer.getMXServer().getUserInfo('MAXADMIN'));
orgset.setWhere("ORGID = '" + invoicembo.getString("ORGID") + "'");
orgset.reset();
organization = orgset.moveFirst();

tmpsalesTaxCodeIds = wfset.getMbo(0).getString("DESCRIPTION");
salesTaxCodeIds = tmpsalesTaxCodeIds.split(",");
description =""
var numberoftaxes = 12;
plustclaimmbo = invoicembo.getMboSet("TCKINVPLUSTCLAIM").moveFirst();
if (plustclaimmbo == null) {
    //ToDo -- Tax distribution
	invoicelineset = mbo.getMboSet("INVOICELINE");
	if (launchPoint == 'TCKAUTOTAXDISTRIBUTION')
	{
invoicelinetax=0.0
invoicelinetax2=0.0
invoicelinetax3=0.0
invoicelinetax4=0.0
invoicelinetax5=0.0
invoicelinetax6=0.0
invoicelinetax7=0.0
invoicelinetax8=0.0
invoicelinetax9=0.0
invoicelinetax10=0.0
invoicelinetax11=0.0
invoicelinetax12=0.0
linecost=0.0
invoicelineset = mbo.getMboSet("INVOICELINE")
invoicelineset.setOrderBy("INVOICELINEID ASC")
counter = 0
while (invoicelineset.getMbo(counter)!=null) {
            invoiceline = invoicelineset.getMbo(counter)
            invoicelinetax += invoiceline.getDouble("TAX1")
            invoicelinetax2 += invoiceline.getDouble("TAX2")
            invoicelinetax3 += invoiceline.getDouble("TAX3")
            invoicelinetax4 += invoiceline.getDouble("TAX4")
            invoicelinetax5 += invoiceline.getDouble("TAX5")
            invoicelinetax6 += invoiceline.getDouble("TAX6")
            invoicelinetax7 += invoiceline.getDouble("TAX7")
            invoicelinetax8 += invoiceline.getDouble("TAX8")
            invoicelinetax9 += invoiceline.getDouble("TAX9")
            invoicelinetax10 += invoiceline.getDouble("TAX10")
            invoicelinetax11 += invoiceline.getDouble("TAX11")
            invoicelinetax12 += invoiceline.getDouble("TAX12")
	    linecost += invoiceline.getDouble("LINECOST")
            counter = counter +1}
TOTALTAX=invoicelinetax+invoicelinetax2+invoicelinetax3+invoicelinetax4+invoicelinetax5+invoicelinetax6+invoicelinetax7+invoicelinetax8+invoicelinetax9+invoicelinetax10+invoicelinetax11+invoicelinetax12

msg="Credit"
sign = +1.0
if (mbo.getString("DOCUMENTTYPE") ==  "CREDIT" || mbo.getString("DOCUMENTTYPE") == "REVCREDIT") {
 sign = -1.0}
 //msg=msg+sign.toString()
 //mbo.setValue("DESCRIPTION_LONGDESCRIPTION",msg)
linecost = sign * linecost
TOTALTAX = sign * TOTALTAX
msg=msg+"linecost:"+linecost.toString()+"TOTALTAX:"+TOTALTAX.toString()
pretaxtotal = mbo.getDouble("PRETAXTOTAL")
taxtotal = mbo.getDouble("TCKTOTALTAX")
dteMboSet = mbo.getMboSet("TCKDTEID")
if( !dteMboSet.isEmpty()){
 prealndomainSet = MXServer.getMXServer().getMboSet('ALNDOMAIN',MXServer.getMXServer().getUserInfo(user))
 prealndomainSet.setWhere("domainid='TCKINVOICELIMITS' and value='DTEPRETAXTOTAL'")
 dtepretaxtotaltolr=prealndomainSet.getMbo(0).getDouble("DESCRIPTION")
 exchrate=mbo.getDouble("EXCHANGERATE")
 //sv - this field to be set with the Exchange rate based on invoice.invoicedate
 taxalndomainSet = MXServer.getMXServer().getMboSet('ALNDOMAIN',MXServer.getMXServer().getUserInfo(user))
 taxalndomainSet.setWhere("domainid='TCKINVOICELIMITS' and value='DTETAXTOTAL'")
 dtetaxtotaltolr=taxalndomainSet.getMbo(0).getDouble("DESCRIPTION")
 if( !dteMboSet.isEmpty()){
  dteMbo=dteMboSet.getMbo(0)
  dtepretaxtotal=dteMbo.getDouble("PRETAXTOTAL")
  dtetaxtotal=dteMbo.getDouble("TOTALTAX")
  msg=msg+"dtepretaxtotal:"+dtepretaxtotal.toString()+"dtetaxtotal:"+dtetaxtotal.toString()
  if ((Math.abs((dtetaxtotal-TOTALTAX)*exchrate)<=dtetaxtotaltolr) && (Math.abs((dtepretaxtotal-linecost)*exchrate)<=dtepretaxtotaltolr)){ 
        //mbo.setValue("DESCRIPTION_LONGDESCRIPTION",msg)
		dteMboSet = mbo.getMboSet("TCKDTEID")
		if (!dteMboSet.isEmpty())
		{
			dteTaxCodeList = []
			dteTaxAmtList = []
			dteMbo = dteMboSet.getMbo(0)
			dteTaxSet = dteMbo.getMboSet("TCKDTETAXNONZERO");
			if (!dteTaxSet.isEmpty())
			{//throw("ish1");
				for (i =0; i<dteTaxSet.count(); i++)
				{      taxsign=sign*dteTaxSet.getMbo(i).getDouble("TAX")
					dteTaxCodeList.push(dteTaxSet.getMbo(i).getString("TAXCODE"))
					dteTaxAmtList.push(taxsign)
				}
			}
//mbo.setValue("DESCRIPTION_LONGDESCRIPTION",msg+dteTaxCodeList.length.toString()+" J2: "+dteTaxAmtList)
			counter = 0
			while(invoicelineset.getMbo(counter)!=null)
			{
				invoiceLine = invoicelineset.getMbo(counter)
				costOfinvoiceLine = invoiceLine.getDouble("LINECOST")
				//iterate on inviceline tax attrs
				invLineTaxCodeList = []
				for (i=1; i<=12; i++)
				{
					taxAttrName = "TAX"+i.toString()+"CODE"
					if (invoiceLine.getString(taxAttrName) != null)
					{
						invLineTaxCodeList.push(invoiceLine.getString(taxAttrName))
					}
				}
				concatError="";
//throw(dteTaxCodeList.length.toString()+" J2: "+dteTaxAmtList)
				for (i=0; i<invLineTaxCodeList.length; i++) {
//throw(dteTaxCodeList.length.toString()+"Here Here "+invLineTaxCodeList.length.toString()+" J1: "+invLineTaxCodeList+" J2: "+dteTaxCodeList)
					//throw(dteTaxCodeList.length.toString()+"Here Here")
					taxCode = invLineTaxCodeList[i]
					if (dteTaxCodeList.indexOf(taxCode)>-1)
					{
						//throw ("here here here here")
						invoicelineset2 = mbo.getMboSet("INVOICELINE")
						countOfinvoicelineset2 = invoicelineset2.count()
						doNotContinue = false
						for (k=0; k<countOfinvoicelineset2; k++)
						{
							compInvLine = invoicelineset2.getMbo(k)
							compLineCost = compInvLine.getDouble("LINECOST")
							//msg=msg+"taxCode:"+taxCode+"compInvLine:"+compInvLine.toString()+"compLineCost:"+compLineCost.toString
							//mbo.setValue("DESCRIPTION_LONGDESCRIPTION",msg)
							//iterate On Taxes
							for (s = 1; s<=12; s++)
							{
								compLineTaxAttrName = "TAX"+s.toString()+"CODE"
								if (compInvLine.getString(compLineTaxAttrName)==taxCode && Math.abs(compLineCost) > Math.abs(costOfinvoiceLine))
								{
									//msg=msg+"taxCode:"+taxCode
									//mbo.setValue("DESCRIPTION_LONGDESCRIPTION",msg)
									doNotContinue = true
									break;
								}
							}
						}
						//throw (doNotContinue)
						if (doNotContinue == false)
						{
							taxAttrName = ""
							taxSumAttr = ""
							//again need to get that tax attr of invoiline which contains taxCode
							for (z=1; z<=12; z++)
							{
								taxAttrName = "TAX"+z.toString()+"CODE"
								if (invoiceLine.getString(taxAttrName) == taxCode)
								{
									taxSumAttr = "TAX"+z.toString()
									break; 
								}
							}
							//below is to get the difference now
							//iterate again on invoicelines to get the sum of taxAttrName
							//sumoftaxAttrNameFrominvoicelineset2 = invoicelineset2.sum(taxSumAttr)
							sumoftaxSumAttrFrominvoicelineset2 = 0
							invoicelineset2 = mbo.getMboSet("INVOICELINE")
							countOfinvoicelineset2 = invoicelineset2.count()
							for (d=0; d<countOfinvoicelineset2; d++)
							{
								if (invoicelineset2.getMbo(d).getString(taxAttrName) == taxCode)
								sumoftaxSumAttrFrominvoicelineset2 = sumoftaxSumAttrFrominvoicelineset2 + invoicelineset2.getMbo(d).getDouble(taxSumAttr)
							}
							indexOfTaxCode = dteTaxCodeList.indexOf(taxCode)
							//throw("sumoftaxSumAttrFrominvoicelineset2" +sumoftaxSumAttrFrominvoicelineset2.toString()+"dteTaxAmtList[indexOfTaxCode]"+dteTaxAmtList[indexOfTaxCode].toString())
							differenceToBeSet =  dteTaxAmtList[indexOfTaxCode] - sumoftaxSumAttrFrominvoicelineset2
							valToBeSet = differenceToBeSet + invoiceLine.getDouble(taxSumAttr)
							concatError += "Sumoftax "+taxAttrName+" with tax "+taxSumAttr+" is "+sumoftaxSumAttrFrominvoicelineset2+" and difference is "+differenceToBeSet+" and value to be set is"+valToBeSet+" \n";
							//throw ("here here "+ valToBeSet.toString() +taxAttrName+differenceToBeSet.toString()+invoiceLine.getDouble(taxSumAttr).toString())
							invoiceLine.setValue(taxSumAttr,valToBeSet, MboConstants.NOACCESSCHECK)
							//mbo.setValue("DESCRIPTION_LONGDESCRIPTION" , mbo.getString("DESCRIPTION_LONGDESCRIPTION")+ differenceToBeSet )
						}
					}
				}
				//throw ("C "+concatError);
				counter = counter +1
			}
			invoicelineset.save()
		}
	}
	}}} //sv - autotaxdistribution - end
	
    //SV - actual logic start calling curvar and pricevar functions and setting TCKCURVAR and TCKPRICEVAR
    for (invoiceline = invoicelineset.moveFirst(); invoiceline != null; invoiceline = invoicelineset.moveNext()) {
        if (invoiceline.getString("PONUM").length != 0 && invoiceline.getString("POLINENUM").length != 0) {
			
            //sv - calling existing calculateCurVarTotal - no change
			lineCurrVar = calculateCurVarTotal(invoiceline);
            curVarTotal = curVarTotal + lineCurrVar;
			
			//sv - calling existing calculatePriceVarTotal - no change
            linePriceVar = calculatePriceVarTotal(invoiceline);
            priceVarTotal = priceVarTotal + linePriceVar;
            taxVarTotal = taxVarTotal + getTaxDiff(invoiceline, salesTaxCodeIds);
			
			
			//SV - MX02L - Added four new lines below - setting TOTalMT fields
			lineCurrVarMT = calculateCurVarTotalMT(invoiceline);
            curVarTotalMT = curVarTotalMT + lineCurrVarMT;
			linePriceVarMT = calculatePriceVarTotalMT(invoiceline);
            priceVarTotalMT = priceVarTotalMT + linePriceVarMT;
			
			

        }
        else {
            lineCurrVar = 0.0;
            linePriceVar = invoiceline.getDouble("loadedcost");
            priceVarTotal = priceVarTotal + invoiceline.getDouble("loadedcost");
            taxVarTotal = taxVarTotal + getTaxDiff(invoiceline, salesTaxCodeIds);
			
			//SV - MX02L - Added two new lines below 
			linePriceVarMT = invoiceline.getDouble("loadedcost");
            priceVarTotalMT = priceVarTotalMT + invoiceline.getDouble("loadedcost");
			
			
        }
        //SV - existing tckcurvar,tckpricevar based on invoice.exchangerate - after flipping the sys prop - sec 3.2 - no change
        invoiceline.setValue("TCKCURVAR", lineCurrVar, MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
        invoiceline.setValue("TCKPRICEVAR", linePriceVar, MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
		
		//SV - calculate currvar and pricevar based on invoice.invoicedate -  sec 3.1
		//SV - MX02L - Addded - setting up the existing matching values in new INVOICE AND INVOICELINE MT fields
		mbo.setValue("TCKMTEXCHANGERATE",exchRateMT , MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
		
		invoiceline.setValue("TCKMTEXCHANGERATE",exchRateMT , MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
		
		invoiceline.setValue("TCKMTCURVAR",lineCurrVarMT , MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
		invoiceline.setValue("TCKMTPRICEVAR",linePriceVarMT , MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
		
		//SV - MX02L - END
		
		//sv - Setting INVOICECOST - invCostCurrVar , inCostPriceVar fields based on lineCurrVar , linePriceVar from above
        invoiceCostSet = invoiceline.getMboSet("INVOICECOST")
        for (invoiceCostMbo = invoiceCostSet.moveFirst(); invoiceCostMbo != null; invoiceCostMbo = invoiceCostSet.moveNext()) {
            entrepval = invoiceCostMbo.getMboSet("TCKNONGLDFLT").moveFirst();
            if (entrepval != null){
                invoiceCostMbo.setValue("TCKENTREPORTING", entrepval.getString("TCKENTREPORTING"), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
                invoiceCostMbo.setValue("TCKACTIVITY", entrepval.getString("TCKACTIVITY"), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
                invoiceCostMbo.setValue("TCKRESPCENTER", entrepval.getString("TCKRESPCENTER"), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION);
            }
            percent = invoiceCostMbo.getDouble("PERCENTAGE");
            if (percent > 0.0) {
                invCostCurrVar = (lineCurrVar * percent) / 100;
                inCostPriceVar = (linePriceVar * percent) / 100;
				
				//sv - MX02L - Added two lines for setting INVCOST MT fields
				invCostCurrVarMT = (lineCurrVarMT * percent) / 100;
                inCostPriceVarMT = (linePriceVarMT * percent) / 100;
				
				//sv - MX02L - Addded -new line below-  setting up the existing matching values in new INVOICECOST MT fields
				invoiceCostMbo.setValue("TCKMTCURVAR", invCostCurrVarMT, MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
				
                invoiceCostMbo.setValue("TCKCURVAR", invCostCurrVar, MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
				
				if (!invoicembo.isConsignmentInvoice()) {
                    if (lineCurrVar != null && lineCurrVar != 0 && invoicembo.getString("STATUS") == "APPR") {
                        transType = "TCKCURVAR";
                        invoicetransmboset = invoiceline.getMboSet("INVOICETRANS");
                        invoicetransmboset.setWhere("TRANSTYPE = '" + transType + "' and COSTLINENUM = " + invoiceCostMbo.getString("COSTLINENUM"));
                        invoicetransmboset.reset()
                        transvarsum = 0.0;
                        if (invoicetransmboset.count() > 0)
                            transvarsum = invoicetransmboset.sum("CURRENCYLINECOST");
                        varglacct = "";
                        if (isServiceType(invoiceline)) {
                            gltmpdef = organization.getMboSet("TCKACCDEFSERVRECCURRVAR").moveFirst();
                            if (gltmpdef != null)
                                varglacct = organization.getMboSet("TCKACCDEFSERVRECCURRVAR").moveFirst().getString("GLDEFAULT");
                        }
                        else {
                            gltmpdef = organization.getMboSet("TCKACCDEFMATRECCURRVAR").moveFirst();
                            if (gltmpdef != null)
                                varglacct = organization.getMboSet("TCKACCDEFMATRECCURRVAR").moveFirst().getString("GLDEFAULT");
                        }
                        if (varglacct == "") {
                            varglacct = invoiceCostMbo.getString("GLDEBITACCT");
                        }
                        insertInvoiceTransRecord(invoiceline, invoiceCostMbo, transType, (invCostCurrVar - transvarsum), varglacct, entrepval);
                    }
                }
				//sv - MX02L - Addded - setting up the existing matching values in new INVOICECOST MT fields
				invoiceCostMbo.setValue("TCKMTPRICEVAR", inCostPriceVarMT, MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
				
                invoiceCostMbo.setValue("TCKPRICEVAR", inCostPriceVar, MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
				
				
                if (!invoicembo.isConsignmentInvoice()) {
                    if (linePriceVar != null && linePriceVar != 0 && invoicembo.getString("STATUS") == "APPR") {
                        transType = "TCKINVCEVAR";
                        invoicetransmboset = invoiceline.getMboSet("INVOICETRANS");
                        invoicetransmboset.setWhere("TRANSTYPE = '" + transType + "' and COSTLINENUM = " + invoiceCostMbo.getString("COSTLINENUM"));
                        invoicetransmboset.reset()
                        transvarsum = 0.0;
                        if (invoicetransmboset.count() > 0)
                            transvarsum = invoicetransmboset.sum("CURRENCYLINECOST");
                        varglacct = "";
                        if (isServiceType(invoiceline)) {
                            gltmpdef = organization.getMboSet("TCKACCDEFSERVRECPRICEVAR").moveFirst();
                            if (gltmpdef != null)
                                varglacct = organization.getMboSet("TCKACCDEFSERVRECPRICEVAR").moveFirst().getString("GLDEFAULT");
                        }
                        else {
                            gltmpdef = organization.getMboSet("TCKACCDEFMATRECPRICEVAR").moveFirst();
                            if (gltmpdef != null)
                                varglacct = organization.getMboSet("TCKACCDEFMATRECPRICEVAR").moveFirst().getString("GLDEFAULT");
                        }
                        if (varglacct == "") {
                            varglacct = invoiceCostMbo.getString("GLDEBITACCT");
                        }
                        insertInvoiceTransRecord(invoiceline, invoiceCostMbo, transType, (inCostPriceVar - transvarsum), varglacct, entrepval);
                    }
                }
            }
        }
    }
}

//SV - warrenty 
if (plustclaimmbo != null) 
{
    curVarTotal = calculateWarrantyCurVarTotal(invoicembo);
    priceVarTotal = calculateWarrantyPriceVarTotal(invoicembo);
    invoicelineset = invoicembo.getMboSet("INVOICELINE");
	//
		//throw("Got into right path launchPoint ="+launchPoint)
	invoicelineset = mbo.getMboSet("INVOICELINE");
	if (launchPoint == 'TCKAUTOTAXDISTRIBUTION')
	{

	}
    //ToDo
    for (invoiceline = invoicelineset.moveFirst(); invoiceline != null; invoiceline = invoicelineset.moveNext()) 
	{
        taxVarTotal = taxVarTotal + getWarrantyTaxDiff(invoiceline, salesTaxCodeIds);
    }
}

//invoicembo.setSyscode(1)
//invoicembo.setValue("DESCRIPTION", description, MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
invoicembo.setValue("TCKPRICEVARTOTAL", parseFloat(priceVarTotal.toFixed(scale)), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
invoicembo.setValue("TCKCURRVARTOTAL", parseFloat(curVarTotal.toFixed(scale)), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
invoicembo.setValue("TCKTAXVARTOTAL", parseFloat(taxVarTotal.toFixed(scale)), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)

/*
//SV - MX02L - ADDED 3 new lines below for MT fields -- not needed so commented
invoicembo.setValue("TCKMTPRICEVARTOTAL", parseFloat(priceVarTotalMT.toFixed(scale)), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
invoicembo.setValue("TCKMTCURRVARTOTAL", parseFloat(curVarTotalMT.toFixed(scale)), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)
invoicembo.setValue("TCKMTTAXVARTOTAL", parseFloat(taxVarTotalMT.toFixed(scale)), MboConstants.NOACCESSCHECK | MboConstants.NOVALIDATION_AND_NOACTION)

*/

